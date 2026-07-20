import { TRPCError } from "@trpc/server";
import { Prisma, type PrismaClient, type TransactionType } from "@prisma/client";
import { toMajor } from "@/lib/money";
import { computeOpeningBalance, getMonthWindows } from "./balance";

/** A Prisma transaction client (the `tx` inside `$transaction`). */
type Tx = Prisma.TransactionClient;

type CreateInput = {
	sourceId: string;
	type: TransactionType;
	amount: bigint;
	category: string;
	note?: string;
	date: string;
	transferTargetId?: string;
};

type UpdateInput = {
	id: string;
	sourceId?: string;
	type?: TransactionType;
	amount?: bigint;
	category?: string;
	note?: string;
	date?: string;
	transferTargetId?: string;
};

const badRequest = (message: string) =>
	new TRPCError({ code: "BAD_REQUEST", message });
const notFound = (message: string) =>
	new TRPCError({ code: "NOT_FOUND", message });

/**
 * Locks the given source rows FOR UPDATE, ordered by id.
 *
 * This has no counterpart in the in-memory original, which was implicitly
 * serialized by Node's event loop. Without it, two concurrent outflows could
 * each read a sufficient balance and both commit, overdrawing the account.
 * The `ORDER BY id` prevents deadlock between two transfers moving money in
 * opposite directions between the same pair of sources.
 */
async function lockSources(tx: Tx, ids: (string | null | undefined)[]) {
	const unique = [...new Set(ids.filter((id): id is string => !!id))];
	if (unique.length === 0) return;
	await tx.$queryRaw`SELECT id FROM "Source" WHERE id = ANY(${unique}) ORDER BY id FOR UPDATE`;
}

/** INFLOW credits; OUTFLOW debits; TRANSFER debits source and credits target. */
async function applyBalanceChange(
	tx: Tx,
	type: TransactionType,
	sourceId: string,
	targetId: string | null | undefined,
	amount: bigint,
) {
	if (type === "inflow") {
		await tx.source.update({
			where: { id: sourceId },
			data: { balance: { increment: amount } },
		});
	} else if (type === "outflow") {
		await tx.source.update({
			where: { id: sourceId },
			data: { balance: { decrement: amount } },
		});
	} else {
		await tx.source.update({
			where: { id: sourceId },
			data: { balance: { decrement: amount } },
		});
		if (targetId) {
			await tx.source.update({
				where: { id: targetId },
				data: { balance: { increment: amount } },
			});
		}
	}
}

/** Exact mirror of applyBalanceChange. */
async function reverseBalanceChange(
	tx: Tx,
	type: TransactionType,
	sourceId: string,
	targetId: string | null | undefined,
	amount: bigint,
) {
	if (type === "inflow") {
		await tx.source.update({
			where: { id: sourceId },
			data: { balance: { decrement: amount } },
		});
	} else if (type === "outflow") {
		await tx.source.update({
			where: { id: sourceId },
			data: { balance: { increment: amount } },
		});
	} else {
		await tx.source.update({
			where: { id: sourceId },
			data: { balance: { increment: amount } },
		});
		if (targetId) {
			await tx.source.update({
				where: { id: targetId },
				data: { balance: { decrement: amount } },
			});
		}
	}
}

const balanceOf = async (tx: Tx, id: string, userId: string) =>
	(await tx.source.findFirst({ where: { id, userId } }))?.balance ?? 0n;

export async function createTransaction(
	db: PrismaClient,
	userId: string,
	input: CreateInput,
) {
	return db.$transaction(async (tx) => {
		const source = await tx.source.findFirst({
			where: { id: input.sourceId, userId },
		});
		if (!source) throw notFound("Source not found");

		if (input.type === "transfer") {
			if (!input.transferTargetId) {
				throw badRequest("transferTargetId is required for transfers");
			}
			if (input.transferTargetId === input.sourceId) {
				throw badRequest("Cannot transfer to the same source");
			}
			const target = await tx.source.findFirst({
				where: { id: input.transferTargetId, userId },
			});
			if (!target) throw notFound("Transfer target source not found");
		}

		await lockSources(tx, [input.sourceId, input.transferTargetId]);

		// Guard on OUTFLOW or TRANSFER; strict < so spending to exactly zero is
		// allowed. No guard on INFLOW.
		if (input.type === "outflow" || input.type === "transfer") {
			const balance = await balanceOf(tx, input.sourceId, userId);
			if (balance < input.amount) {
				throw badRequest(
					`Insufficient balance in "${source.name}". Available: ${toMajor(balance)}`,
				);
			}
		}

		await applyBalanceChange(
			tx,
			input.type,
			input.sourceId,
			input.transferTargetId,
			input.amount,
		);

		return tx.transaction.create({
			data: {
				userId,
				sourceId: input.sourceId,
				type: input.type,
				amount: input.amount,
				category: input.category,
				note: input.note ?? "",
				date: new Date(input.date),
				transferTargetId: input.transferTargetId ?? null,
			},
		});
	});
}

export async function updateTransaction(
	db: PrismaClient,
	userId: string,
	input: UpdateInput,
) {
	return db.$transaction(async (tx) => {
		const existing = await tx.transaction.findFirst({
			where: { id: input.id, userId },
		});
		if (!existing) throw notFound("Transaction not found");

		const newType = input.type ?? existing.type;
		const newSourceId = input.sourceId ?? existing.sourceId;
		const newAmount = input.amount ?? existing.amount;
		// ?? means a transfer target can never be cleared via update — preserved
		// from the original (a known limitation, tracked as a follow-up).
		const newTargetId = input.transferTargetId ?? existing.transferTargetId;

		const newSource = await tx.source.findFirst({
			where: { id: newSourceId, userId },
		});
		if (!newSource) throw notFound("Source not found");

		if (newType === "transfer") {
			if (!newTargetId) {
				throw badRequest("transferTargetId is required for transfers");
			}
			if (newTargetId === newSourceId) {
				throw badRequest("Cannot transfer to the same source");
			}
			const target = await tx.source.findFirst({
				where: { id: newTargetId, userId },
			});
			if (!target) throw notFound("Transfer target source not found");
		}

		await lockSources(tx, [
			existing.sourceId,
			existing.transferTargetId,
			newSourceId,
			newTargetId,
		]);

		// Reverse the old effects.
		await reverseBalanceChange(
			tx,
			existing.type,
			existing.sourceId,
			existing.transferTargetId,
			existing.amount,
		);

		// Guard against the new state. If it fails, throwing rolls back the whole
		// $transaction — no manual rollback needed. This is also why the reported
		// figure is now the POST-REVERSE balance (the value actually compared),
		// unlike the NestJS version which reported a post-rollback value due to
		// object aliasing.
		if (newType === "outflow" || newType === "transfer") {
			const balanceAfterReverse = await balanceOf(tx, newSourceId, userId);
			if (balanceAfterReverse < newAmount) {
				throw badRequest(
					`Insufficient balance in "${newSource.name}" after edit. Available: ${toMajor(balanceAfterReverse)}`,
				);
			}
		}

		await applyBalanceChange(tx, newType, newSourceId, newTargetId, newAmount);

		return tx.transaction.update({
			where: { id: input.id },
			data: {
				...(input.sourceId !== undefined && { sourceId: input.sourceId }),
				...(input.type !== undefined && { type: input.type }),
				...(input.amount !== undefined && { amount: input.amount }),
				...(input.category !== undefined && { category: input.category }),
				...(input.note !== undefined && { note: input.note }),
				...(input.date !== undefined && { date: new Date(input.date) }),
				...(input.transferTargetId !== undefined && {
					transferTargetId: input.transferTargetId,
				}),
			},
		});
	});
}

export async function deleteTransaction(
	db: PrismaClient,
	userId: string,
	id: string,
) {
	return db.$transaction(async (tx) => {
		const existing = await tx.transaction.findFirst({
			where: { id, userId },
		});
		if (!existing) throw notFound("Transaction not found");

		await lockSources(tx, [existing.sourceId, existing.transferTargetId]);

		// Guards fire BEFORE the reversal. Reversing an inflow debits the source;
		// reversing a transfer debits the target. Outflow reversal only adds, so
		// it needs no guard.
		if (existing.type === "inflow") {
			const source = await tx.source.findFirst({
				where: { id: existing.sourceId },
			});
			if (source && source.balance < existing.amount) {
				throw badRequest(
					`Cannot delete: reversing this inflow would cause negative balance in "${source.name}"`,
				);
			}
		} else if (existing.type === "transfer" && existing.transferTargetId) {
			const target = await tx.source.findFirst({
				where: { id: existing.transferTargetId },
			});
			if (target && target.balance < existing.amount) {
				throw badRequest(
					`Cannot delete: reversing this transfer would cause negative balance in "${target.name}"`,
				);
			}
		}

		await reverseBalanceChange(
			tx,
			existing.type,
			existing.sourceId,
			existing.transferTargetId,
			existing.amount,
		);

		return tx.transaction.delete({ where: { id } });
	});
}

// ---- read-side ----

export async function listTransactions(
	db: PrismaClient,
	userId: string,
	filters?: {
		sourceId?: string;
		type?: TransactionType;
		startDate?: string;
		endDate?: string;
	},
) {
	const where: Prisma.TransactionWhereInput = { userId };
	if (filters?.sourceId) {
		where.OR = [
			{ sourceId: filters.sourceId },
			{ transferTargetId: filters.sourceId },
		];
	}
	if (filters?.type) where.type = filters.type;
	if (filters?.startDate) where.date = { gte: new Date(filters.startDate) };
	if (filters?.endDate) {
		where.date = {
			...(where.date as object),
			lte: new Date(filters.endDate),
		};
	}
	return db.transaction.findMany({ where, orderBy: { date: "desc" } });
}

export async function getOverview(db: PrismaClient, userId: string) {
	const [sources, transactions] = await Promise.all([
		db.source.findMany({ where: { userId } }),
		db.transaction.findMany({ where: { userId } }),
	]);
	const sourceById = new Map(sources.map((s) => [s.id, s]));

	const totals = transactions.reduce(
		(acc, tx) => {
			if (tx.type === "inflow") acc.inflow += tx.amount;
			if (tx.type === "outflow") acc.outflow += tx.amount;
			if (tx.type === "transfer") acc.transfer += tx.amount;
			return acc;
		},
		{ inflow: 0n, outflow: 0n, transfer: 0n },
	);

	const totalBalance = sources.reduce((sum, s) => sum + s.balance, 0n);
	const totalInitialBalance = sources.reduce(
		(sum, s) => sum + computeOpeningBalance(s.id, s.balance, transactions),
		0n,
	);

	const now = new Date();
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const monthEnd = new Date(
		now.getFullYear(),
		now.getMonth() + 1,
		0,
		23,
		59,
		59,
		999,
	);
	const monthly = transactions.filter((tx) => {
		const d = new Date(tx.date);
		return d >= monthStart && d <= monthEnd;
	});
	const sumType = (list: typeof transactions, type: TransactionType) =>
		list.filter((tx) => tx.type === type).reduce((s, tx) => s + tx.amount, 0n);

	const monthlyInflow = sumType(monthly, "inflow");
	const monthlyOutflow = sumType(monthly, "outflow");
	const monthlyTransfer = sumType(monthly, "transfer");

	const recentTransactions = [...transactions]
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.slice(0, 10)
		.map((tx) => ({
			...tx,
			sourceName: sourceById.get(tx.sourceId)?.name ?? tx.sourceId,
			transferTargetName: tx.transferTargetId
				? (sourceById.get(tx.transferTargetId)?.name ?? tx.transferTargetId)
				: undefined,
		}));

	return {
		totalBalance,
		totalInitialBalance,
		allTime: {
			inflow: totals.inflow,
			outflow: totals.outflow,
			transfer: totals.transfer,
			net: totals.inflow - totals.outflow,
		},
		monthly: {
			period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
			inflow: monthlyInflow,
			outflow: monthlyOutflow,
			transfer: monthlyTransfer,
			net: monthlyInflow - monthlyOutflow,
		},
		recentTransactions,
	};
}

export async function getTrends(
	db: PrismaClient,
	userId: string,
	months: number,
) {
	const boundedMonths = Math.min(Math.max(months, 1), 24);
	const [sources, transactions] = await Promise.all([
		db.source.findMany({ where: { userId } }),
		db.transaction.findMany({ where: { userId } }),
	]);
	const windows = getMonthWindows(boundedMonths);

	const inWindow = (w: (typeof windows)[number]) =>
		transactions.filter((tx) => {
			const d = new Date(tx.date);
			return d >= w.start && d <= w.end;
		});
	const sumType = (list: typeof transactions, type: TransactionType) =>
		list.filter((tx) => tx.type === type).reduce((s, tx) => s + tx.amount, 0n);

	const totalsByMonth = windows.map((w) => {
		const monthTx = inWindow(w);
		const inflow = sumType(monthTx, "inflow");
		const outflow = sumType(monthTx, "outflow");
		const transfer = sumType(monthTx, "transfer");
		return {
			period: w.key,
			inflow,
			outflow,
			transfer,
			total: inflow + outflow + transfer,
		};
	});

	const bySource = windows.map((w) => {
		const monthTx = inWindow(w);
		const values = sources.map((source) => {
			const forSource = monthTx.filter(
				(tx) =>
					tx.sourceId === source.id || tx.transferTargetId === source.id,
			);
			const inflow = forSource
				.filter((tx) => tx.type === "inflow" && tx.sourceId === source.id)
				.reduce((s, tx) => s + tx.amount, 0n);
			const outflow = forSource
				.filter((tx) => tx.type === "outflow" && tx.sourceId === source.id)
				.reduce((s, tx) => s + tx.amount, 0n);
			// NOTE: preserved bug — this counts every transfer touching the month,
			// not restricted to this source. Tracked as a follow-up.
			const transfer = forSource
				.filter((tx) => tx.type === "transfer")
				.reduce((s, tx) => s + tx.amount, 0n);
			return {
				sourceId: source.id,
				sourceName: source.name,
				inflow,
				outflow,
				transfer,
				total: inflow + outflow + transfer,
			};
		});
		return { period: w.key, values };
	});

	return { months: boundedMonths, totalsByMonth, bySource };
}
