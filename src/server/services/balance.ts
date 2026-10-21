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

export type TimeWindow = { key: string; start: Date; end: Date };
export type Granularity = "weekly" | "biweekly" | "monthly" | "yearly";

const fmtDate = (d: Date) =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
		d.getDate(),
	).padStart(2, "0")}`;

/** Month windows walked backwards from now (inclusive of the current month). */
export function getMonthWindows(months: number): TimeWindow[] {
	const now = new Date();
	const windows: TimeWindow[] = [];
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

/** Monday 00:00 of the week containing `d`. */
function startOfWeek(d: Date): Date {
	const day = d.getDay(); // 0=Sun … 6=Sat
	const diff = (day === 0 ? -6 : 1) - day; // back to Monday
	return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
}

/**
 * `count` windows of `weeksPer` weeks each, walked back from the current week
 * (inclusive). Keyed by the window's start date (YYYY-MM-DD).
 */
export function getWeekWindows(count: number, weeksPer = 1): TimeWindow[] {
	const currentStart = startOfWeek(new Date());
	const windows: TimeWindow[] = [];
	for (let offset = count - 1; offset >= 0; offset -= 1) {
		const start = new Date(currentStart);
		start.setDate(currentStart.getDate() - offset * 7 * weeksPer);
		const end = new Date(start);
		end.setDate(start.getDate() + 7 * weeksPer - 1);
		end.setHours(23, 59, 59, 999);
		windows.push({ key: fmtDate(start), start, end });
	}
	return windows;
}

/** `count` calendar-year windows walked back from the current year (inclusive). */
export function getYearWindows(count: number): TimeWindow[] {
	const year = new Date().getFullYear();
	const windows: TimeWindow[] = [];
	for (let offset = count - 1; offset >= 0; offset -= 1) {
		const y = year - offset;
		windows.push({
			key: String(y),
			start: new Date(y, 0, 1),
			end: new Date(y, 11, 31, 23, 59, 59, 999),
		});
	}
	return windows;
}

/**
 * Windows for a chart granularity. `months` only applies to the monthly case;
 * the others use a sensible fixed count so the x-axis stays readable.
 */
export function getWindows(
	granularity: Granularity,
	months = 6,
): TimeWindow[] {
	switch (granularity) {
		case "weekly":
			return getWeekWindows(8, 1);
		case "biweekly":
			return getWeekWindows(6, 2);
		case "yearly":
			return getYearWindows(4);
		default:
			return getMonthWindows(months);
	}
}
