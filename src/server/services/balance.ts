import type { Transaction } from "@prisma/client";

export interface SourceStats {
	openingBalance: bigint;
	totalInflow: bigint;
	totalOutflow: bigint;
	totalTransferIn: bigint;
	totalTransferOut: bigint;
	transactionCount: number;
	lastTransactionAt?: Date;
}

/**
 * Derives a source's opening balance and flow totals from its current balance
 * and the transaction ledger.
 *
 * `source.balance` is a running total kept up to date by the balance engine, so
 * the opening figure is walked backwards out of it:
 *
 *   opening = current - inflow + outflow + transferOut - transferIn
 *
 * A transaction is "related" if the source is the origin (`sourceId`) or the
 * destination of a transfer (`transferTargetId`). The per-direction totals
 * additionally require `sourceId === id` so an incoming transfer leg is not
 * also counted as an outflow.
 *
 * All arithmetic is BigInt minor units. This is the single implementation,
 * ported from the NestJS `computeSourceStats` (which was itself the
 * consolidation of four copies).
 */
export function computeSourceStats(
	sourceId: string,
	currentBalance: bigint,
	transactions: Pick<
		Transaction,
		"sourceId" | "transferTargetId" | "type" | "amount" | "date"
	>[],
): SourceStats {
	const related = transactions.filter(
		(tx) => tx.sourceId === sourceId || tx.transferTargetId === sourceId,
	);

	const sumWhere = (predicate: (tx: (typeof related)[number]) => boolean) =>
		related.filter(predicate).reduce((sum, tx) => sum + tx.amount, 0n);

	const totalInflow = sumWhere(
		(tx) => tx.type === "inflow" && tx.sourceId === sourceId,
	);
	const totalOutflow = sumWhere(
		(tx) => tx.type === "outflow" && tx.sourceId === sourceId,
	);
	const totalTransferOut = sumWhere(
		(tx) => tx.type === "transfer" && tx.sourceId === sourceId,
	);
	const totalTransferIn = sumWhere(
		(tx) => tx.type === "transfer" && tx.transferTargetId === sourceId,
	);

	const openingBalance =
		currentBalance -
		totalInflow +
		totalOutflow +
		totalTransferOut -
		totalTransferIn;

	const sortedDates = related
		.map((tx) => new Date(tx.date))
		.sort((a, b) => b.getTime() - a.getTime());

	return {
		openingBalance,
		totalInflow,
		totalOutflow,
		totalTransferIn,
		totalTransferOut,
		transactionCount: related.length,
		lastTransactionAt: sortedDates[0],
	};
}

export function computeOpeningBalance(
	sourceId: string,
	currentBalance: bigint,
	transactions: Parameters<typeof computeSourceStats>[2],
): bigint {
	return computeSourceStats(sourceId, currentBalance, transactions)
		.openingBalance;
}

/** Month windows walked backwards from now (inclusive of the current month). */
export function getMonthWindows(months: number) {
	const now = new Date();
	const windows: { key: string; start: Date; end: Date }[] = [];
	for (let offset = months - 1; offset >= 0; offset -= 1) {
		const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
		const end = new Date(
			now.getFullYear(),
			now.getMonth() - offset + 1,
			0,
			23,
			59,
			59,
			999,
		);
		const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
		windows.push({ key, start, end });
	}
	return windows;
}
