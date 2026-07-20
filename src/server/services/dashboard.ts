import type { PrismaClient } from "@prisma/client";
import { computeOpeningBalance } from "./balance";

export async function getDashboard(db: PrismaClient, userId: string) {
	const [sources, transactions] = await Promise.all([
		db.source.findMany({ where: { userId } }),
		db.transaction.findMany({ where: { userId } }),
	]);

	const sourcesSummary = sources.map((s) => ({
		id: s.id,
		name: s.name,
		balance: s.balance,
		currency: s.currency,
		openingBalance: computeOpeningBalance(s.id, s.balance, transactions),
		createdAt: s.createdAt,
		updatedAt: s.updatedAt,
	}));

	const totalBalance = sources.reduce((sum, s) => sum + s.balance, 0n);
	const totalInitialBalance = sourcesSummary.reduce(
		(sum, s) => sum + s.openingBalance,
		0n,
	);

	const now = new Date();
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
	const monthlyTxs = transactions.filter((t) => {
		const d = new Date(t.date);
		return d >= monthStart && d <= monthEnd;
	});
	const monthlyInflow = monthlyTxs
		.filter((t) => t.type === "inflow")
		.reduce((sum, t) => sum + t.amount, 0n);
	const monthlyOutflow = monthlyTxs
		.filter((t) => t.type === "outflow")
		.reduce((sum, t) => sum + t.amount, 0n);

	const recentTransactions = [...transactions]
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.slice(0, 10)
		.map((t) => ({
			...t,
			sourceName: sources.find((s) => s.id === t.sourceId)?.name ?? t.sourceId,
			transferTargetName: t.transferTargetId
				? (sources.find((s) => s.id === t.transferTargetId)?.name ??
					t.transferTargetId)
				: undefined,
		}));

	return {
		totalBalance,
		totalInitialBalance,
		sources: sourcesSummary,
		setup: {
			hasSources: sources.length > 0,
			hasTransactions: transactions.length > 0,
			nextAction:
				sources.length === 0
					? "add-source"
					: transactions.length === 0
						? "add-transaction"
						: "view-dashboard",
		},
		monthly: {
			period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
			inflow: monthlyInflow,
			outflow: monthlyOutflow,
			net: monthlyInflow - monthlyOutflow,
		},
		recentTransactions,
	};
}
