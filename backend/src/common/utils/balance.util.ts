import { TransactionType } from '../interfaces';

/**
 * The minimum shape needed to derive a source's stats. Deliberately structural
 * rather than `ITransaction` so callers can pass projections.
 */
export interface BalanceTransaction {
  sourceId: string;
  transferTargetId?: string;
  type: TransactionType;
  amount: number;
  date: Date;
}

export interface SourceStats {
  openingBalance: number;
  totalInflow: number;
  totalOutflow: number;
  totalTransferIn: number;
  totalTransferOut: number;
  transactionCount: number;
  lastTransactionAt?: Date;
}

/**
 * Derives a source's opening balance and flow totals from its current balance
 * and the transaction ledger.
 *
 * The opening balance is NOT stored — `source.balance` is a running total kept
 * up to date by the balance engine, so the opening figure has to be walked
 * backwards out of it:
 *
 *   opening = current - inflow + outflow + transferOut - transferIn
 *
 * A transaction is "related" to a source if the source is either the origin
 * (`sourceId`) or the destination of a transfer (`transferTargetId`). Note the
 * per-direction totals additionally require `sourceId === sourceId` so that the
 * incoming leg of a transfer is not also counted as an outflow.
 *
 * This was previously duplicated in four services (sources, transactions,
 * dashboard, reconciliation); it is the single implementation.
 */
export function computeSourceStats(
  sourceId: string,
  currentBalance: number,
  transactions: BalanceTransaction[],
): SourceStats {
  const related = transactions.filter(
    (tx) => tx.sourceId === sourceId || tx.transferTargetId === sourceId,
  );

  const sumWhere = (predicate: (tx: BalanceTransaction) => boolean) =>
    related.filter(predicate).reduce((sum, tx) => sum + tx.amount, 0);

  const totalInflow = sumWhere(
    (tx) => tx.type === TransactionType.INFLOW && tx.sourceId === sourceId,
  );
  const totalOutflow = sumWhere(
    (tx) => tx.type === TransactionType.OUTFLOW && tx.sourceId === sourceId,
  );
  const totalTransferOut = sumWhere(
    (tx) => tx.type === TransactionType.TRANSFER && tx.sourceId === sourceId,
  );
  const totalTransferIn = sumWhere(
    (tx) =>
      tx.type === TransactionType.TRANSFER && tx.transferTargetId === sourceId,
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

/**
 * Convenience wrapper for the callers that only need the opening figure.
 */
export function computeOpeningBalance(
  sourceId: string,
  currentBalance: number,
  transactions: BalanceTransaction[],
): number {
  return computeSourceStats(sourceId, currentBalance, transactions)
    .openingBalance;
}
