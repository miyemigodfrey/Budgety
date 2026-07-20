import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { computeSourceStats } from "./balance";

const notFound = () =>
	new TRPCError({ code: "NOT_FOUND", message: "Source not found" });

export async function listSources(db: PrismaClient, userId: string) {
	const [sources, transactions] = await Promise.all([
		db.source.findMany({ where: { userId } }),
		db.transaction.findMany({ where: { userId } }),
	]);
	return sources.map((source) => {
		const stats = computeSourceStats(source.id, source.balance, transactions);
		return {
			...source,
			initialBalance: stats.openingBalance,
			remainingBalance: source.balance,
		};
	});
}

export async function getSourcesOverview(db: PrismaClient, userId: string) {
	const [sources, transactions] = await Promise.all([
		db.source.findMany({ where: { userId } }),
		db.transaction.findMany({ where: { userId } }),
	]);

	const summaries = sources.map((source) => {
		const stats = computeSourceStats(source.id, source.balance, transactions);
		return {
			id: source.id,
			name: source.name,
			currency: source.currency,
			openingBalance: stats.openingBalance,
			currentBalance: source.balance,
			totalInflow: stats.totalInflow,
			totalOutflow: stats.totalOutflow,
			totalTransferIn: stats.totalTransferIn,
			totalTransferOut: stats.totalTransferOut,
			netChange: source.balance - stats.openingBalance,
			transactionCount: stats.transactionCount,
			lastTransactionAt: stats.lastTransactionAt,
		};
	});

	const sum = (pick: (s: (typeof summaries)[number]) => bigint) =>
		summaries.reduce((acc, s) => acc + pick(s), 0n);

	const totalCurrentBalance = sum((s) => s.currentBalance);
	const totalOpeningBalance = sum((s) => s.openingBalance);

	return {
		totalSources: sources.length,
		totalCurrentBalance,
		totalOpeningBalance,
		totalInflow: sum((s) => s.totalInflow),
		totalOutflow: sum((s) => s.totalOutflow),
		totalNetChange: totalCurrentBalance - totalOpeningBalance,
		sources: summaries,
	};
}

export async function getSourceById(
	db: PrismaClient,
	userId: string,
	id: string,
) {
	const source = await db.source.findFirst({ where: { id, userId } });
	if (!source) throw notFound();

	const [transactions, allTransactions] = await Promise.all([
		db.transaction.findMany({
			where: { userId, OR: [{ sourceId: id }, { transferTargetId: id }] },
			orderBy: { date: "desc" },
		}),
		db.transaction.findMany({ where: { userId } }),
	]);

	const stats = computeSourceStats(id, source.balance, allTransactions);
	return {
		...source,
		initialBalance: stats.openingBalance,
		remainingBalance: source.balance,
		transactions,
	};
}

export async function getSourceSummary(
	db: PrismaClient,
	userId: string,
	id: string,
	period: "daily" | "monthly" | "yearly" | "all",
) {
	const source = await db.source.findFirst({ where: { id, userId } });
	if (!source) throw notFound();

	const { start, end } = getDateRange(period);
	const transactions = await db.transaction.findMany({
		where: {
			userId,
			OR: [{ sourceId: id }, { transferTargetId: id }],
			date: { gte: start, lte: end },
		},
	});

	const summary = transactions.reduce(
		(acc, tx) => {
			if (tx.type === "inflow" && tx.sourceId === id) acc.inflow += tx.amount;
			if (tx.type === "outflow" && tx.sourceId === id) acc.outflow += tx.amount;
			return acc;
		},
		{ inflow: 0n, outflow: 0n },
	);

	return {
		inflow: summary.inflow,
		outflow: summary.outflow,
		net: summary.inflow - summary.outflow,
		period,
	};
}

export async function createSource(
	db: PrismaClient,
	userId: string,
	input: { name: string; balance: bigint; currency?: string },
) {
	return db.source.create({
		data: {
			userId,
			name: input.name,
			balance: input.balance,
			currency: input.currency ?? "NGN",
		},
	});
}

export async function updateSource(
	db: PrismaClient,
	userId: string,
	input: { id: string; name?: string; currency?: string; balance?: bigint },
) {
	const existing = await db.source.findFirst({
		where: { id: input.id, userId },
	});
	if (!existing) throw notFound();

	return db.source.update({
		where: { id: input.id },
		data: {
			...(input.name !== undefined && { name: input.name }),
			...(input.currency !== undefined && { currency: input.currency }),
			...(input.balance !== undefined && { balance: input.balance }),
		},
	});
}

export async function deleteSource(
	db: PrismaClient,
	userId: string,
	id: string,
) {
	const existing = await db.source.findFirst({ where: { id, userId } });
	if (!existing) throw notFound();
	// Transactions on either side cascade via the schema's onDelete: Cascade.
	await db.source.delete({ where: { id } });
}

function getDateRange(period: string): { start: Date; end: Date } {
	const now = new Date();
	if (period === "daily") {
		const start = new Date(now);
		start.setHours(0, 0, 0, 0);
		return { start, end: new Date() };
	}
	if (period === "monthly") {
		return {
			start: new Date(now.getFullYear(), now.getMonth(), 1),
			end: new Date(),
		};
	}
	if (period === "yearly") {
		return { start: new Date(now.getFullYear(), 0, 1), end: new Date() };
	}
	// all
	return { start: new Date(0), end: new Date() };
}
