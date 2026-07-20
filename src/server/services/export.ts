import type { PrismaClient, Transaction } from "@prisma/client";
import { getMonthWindows } from "./balance";

/** JSON summary for the Reports page. */
export async function getSummary(
	db: PrismaClient,
	userId: string,
	months: number,
) {
	const boundedMonths = Math.min(Math.max(months, 1), 24);
	const [sources, transactions] = await Promise.all([
		db.source.findMany({ where: { userId } }),
		db.transaction.findMany({ where: { userId } }),
	]);

	const totalBalance = sources.reduce((sum, s) => sum + s.balance, 0n);

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
	const sumType = (list: Transaction[], type: Transaction["type"]) =>
		list.filter((tx) => tx.type === type).reduce((s, tx) => s + tx.amount, 0n);
	const monthlyInflow = sumType(monthly, "inflow");
	const monthlyOutflow = sumType(monthly, "outflow");

	const windows = getMonthWindows(boundedMonths);
	const inWindow = (w: (typeof windows)[number]) =>
		transactions.filter((tx) => {
			const d = new Date(tx.date);
			return d >= w.start && d <= w.end;
		});

	const totalTransactionsSeries = windows.map((w) => ({
		period: w.key,
		total: inWindow(w).reduce((s, tx) => s + tx.amount, 0n),
	}));

	const breakdownSeries = windows.map((w) => {
		const monthTx = inWindow(w);
		return {
			period: w.key,
			sources: sources.map((source) => ({
				sourceId: source.id,
				sourceName: source.name,
				amount: monthTx
					.filter(
						(tx) =>
							tx.sourceId === source.id ||
							tx.transferTargetId === source.id,
					)
					.reduce((s, tx) => s + tx.amount, 0n),
			})),
		};
	});

	const sourceById = new Map(sources.map((s) => [s.id, s]));
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
		monthly: {
			period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
			inflow: monthlyInflow,
			outflow: monthlyOutflow,
			net: monthlyInflow - monthlyOutflow,
		},
		charts: { totalTransactionsSeries, breakdownSeries },
		recentTransactions,
	};
}

function resolveDateRange(startDate?: string, endDate?: string) {
	const now = new Date();
	const start = startDate
		? new Date(startDate)
		: new Date(now.getFullYear(), now.getMonth(), 1);
	const end = endDate ? new Date(endDate) : new Date(now);
	end.setHours(23, 59, 59, 999);

	const fmt = (d: Date) =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	return { start, end, startDate: fmt(start), endDate: fmt(end) };
}

function escapeCsv(value: string) {
	const hasSpecialChars = /[",\n]/.test(value);
	const escaped = value.replace(/"/g, '""');
	return hasSpecialChars ? `"${escaped}"` : escaped;
}

/** CSV export. Amount is emitted in minor units to match the raw stored value. */
export async function buildCsv(
	db: PrismaClient,
	userId: string,
	startDate?: string,
	endDate?: string,
) {
	const range = resolveDateRange(startDate, endDate);
	const [sources, allTransactions] = await Promise.all([
		db.source.findMany({ where: { userId } }),
		db.transaction.findMany({ where: { userId } }),
	]);
	const sourceById = new Map(sources.map((s) => [s.id, s]));

	const transactions = allTransactions
		.filter((tx) => {
			const d = new Date(tx.date);
			return d >= range.start && d <= range.end;
		})
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	const header = [
		"id",
		"date",
		"type",
		"sourceId",
		"sourceName",
		"transferTargetId",
		"transferTargetName",
		"amount",
		"category",
		"note",
	];

	const rows = transactions.map((tx) => {
		const sourceName = sourceById.get(tx.sourceId)?.name ?? tx.sourceId;
		const transferTargetName = tx.transferTargetId
			? (sourceById.get(tx.transferTargetId)?.name ?? tx.transferTargetId)
			: "";
		return [
			tx.id,
			new Date(tx.date).toISOString(),
			tx.type,
			tx.sourceId,
			sourceName,
			tx.transferTargetId ?? "",
			transferTargetName,
			tx.amount.toString(),
			tx.category,
			tx.note,
		]
			.map((value) => escapeCsv(String(value)))
			.join(",");
	});

	return {
		csv: [header.join(","), ...rows].join("\n"),
		range: { startDate: range.startDate, endDate: range.endDate },
		rowCount: rows.length,
	};
}

/** Fetches sources + filtered transactions for the PDF route. */
export async function getPdfData(
	db: PrismaClient,
	userId: string,
	startDate: string,
	endDate: string,
) {
	const [sources, user, allTransactions] = await Promise.all([
		db.source.findMany({ where: { userId } }),
		db.user.findUnique({ where: { id: userId } }),
		db.transaction.findMany({ where: { userId } }),
	]);
	if (sources.length === 0) return null;

	const range = resolveDateRange(startDate, endDate);
	const transactions = allTransactions
		.filter((t) => {
			const d = new Date(t.date);
			return d >= range.start && d <= range.end;
		})
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	return { sources, transactions, userName: user?.name ?? "User" };
}
