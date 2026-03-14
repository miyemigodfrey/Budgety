import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../../common/services/storage.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { ISource, TransactionType } from '../../common/interfaces';

@Injectable()
export class SourcesService {
  constructor(private readonly storage: StorageService) {}

  findAll(userId: string): ISource[] {
    return this.storage.findSourcesByUserId(userId);
  }

  findOverview(userId: string) {
    const sources = this.storage.findSourcesByUserId(userId);
    const transactions = this.storage.findTransactionsByUserId(userId);

    const sourceSummaries = sources.map((source) => {
      const stats = this.computeSourceStats(
        source.id,
        source.balance,
        transactions,
      );
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

    const totalCurrentBalance = sourceSummaries.reduce(
      (sum, item) => sum + item.currentBalance,
      0,
    );
    const totalOpeningBalance = sourceSummaries.reduce(
      (sum, item) => sum + item.openingBalance,
      0,
    );
    const totalInflow = sourceSummaries.reduce(
      (sum, item) => sum + item.totalInflow,
      0,
    );
    const totalOutflow = sourceSummaries.reduce(
      (sum, item) => sum + item.totalOutflow,
      0,
    );

    return {
      totalSources: sources.length,
      totalCurrentBalance,
      totalOpeningBalance,
      totalInflow,
      totalOutflow,
      totalNetChange: totalCurrentBalance - totalOpeningBalance,
      sources: sourceSummaries,
    };
  }

  findOne(id: string, userId: string) {
    const source = this.storage.findSourceById(id, userId);
    if (!source) throw new NotFoundException('Source not found');

    const transactions = this.storage.findTransactionsBySourceId(id, userId);
    return { ...source, transactions };
  }

  findOverviewById(id: string, userId: string) {
    const source = this.storage.findSourceById(id, userId);
    if (!source) throw new NotFoundException('Source not found');

    const allTransactions = this.storage.findTransactionsByUserId(userId);
    const sourceTransactions = this.storage
      .findTransactionsBySourceId(id, userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const stats = this.computeSourceStats(id, source.balance, allTransactions);
    const sourceById = new Map(
      this.storage
        .findSourcesByUserId(userId)
        .map((entry) => [entry.id, entry]),
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

    const monthlyTx = sourceTransactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate >= monthStart && txDate <= monthEnd;
    });

    const monthlyInflow = monthlyTx
      .filter((tx) => tx.type === TransactionType.INFLOW && tx.sourceId === id)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const monthlyOutflow = monthlyTx
      .filter((tx) => tx.type === TransactionType.OUTFLOW && tx.sourceId === id)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const monthlyTransferOut = monthlyTx
      .filter(
        (tx) => tx.type === TransactionType.TRANSFER && tx.sourceId === id,
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    const monthlyTransferIn = monthlyTx
      .filter(
        (tx) =>
          tx.type === TransactionType.TRANSFER && tx.transferTargetId === id,
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      source: {
        ...source,
        openingBalance: stats.openingBalance,
      },
      summary: {
        currentBalance: source.balance,
        openingBalance: stats.openingBalance,
        totalInflow: stats.totalInflow,
        totalOutflow: stats.totalOutflow,
        totalTransferIn: stats.totalTransferIn,
        totalTransferOut: stats.totalTransferOut,
        netChange: source.balance - stats.openingBalance,
        transactionCount: stats.transactionCount,
      },
      monthly: {
        period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        inflow: monthlyInflow,
        outflow: monthlyOutflow,
        transferIn: monthlyTransferIn,
        transferOut: monthlyTransferOut,
        net:
          monthlyInflow +
          monthlyTransferIn -
          monthlyOutflow -
          monthlyTransferOut,
      },
      recentTransactions: sourceTransactions.slice(0, 10).map((tx) => ({
        ...tx,
        sourceName: sourceById.get(tx.sourceId)?.name ?? tx.sourceId,
        transferTargetName: tx.transferTargetId
          ? (sourceById.get(tx.transferTargetId)?.name ?? tx.transferTargetId)
          : undefined,
      })),
    };
  }

  create(dto: CreateSourceDto, userId: string): ISource {
    const source: ISource = {
      id: crypto.randomUUID(),
      userId,
      name: dto.name,
      balance: dto.balance,
      currency: dto.currency ?? 'NGN',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.storage.createSource(source);
  }

  update(id: string, dto: UpdateSourceDto, userId: string): ISource {
    const updated = this.storage.updateSource(id, userId, dto);
    if (!updated) throw new NotFoundException('Source not found');
    return updated;
  }

  delete(id: string, userId: string): void {
    this.storage.deleteTransactionsBySourceId(id, userId);
    const deleted = this.storage.deleteSource(id, userId);
    if (!deleted) throw new NotFoundException('Source not found');
  }

  private computeSourceStats(
    sourceId: string,
    currentBalance: number,
    transactions: Array<{
      sourceId: string;
      transferTargetId?: string;
      type: TransactionType;
      amount: number;
      date: Date;
    }>,
  ) {
    const relatedTransactions = transactions.filter(
      (tx) => tx.sourceId === sourceId || tx.transferTargetId === sourceId,
    );

    const totalInflow = relatedTransactions
      .filter(
        (tx) => tx.type === TransactionType.INFLOW && tx.sourceId === sourceId,
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalOutflow = relatedTransactions
      .filter(
        (tx) => tx.type === TransactionType.OUTFLOW && tx.sourceId === sourceId,
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalTransferOut = relatedTransactions
      .filter(
        (tx) =>
          tx.type === TransactionType.TRANSFER && tx.sourceId === sourceId,
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalTransferIn = relatedTransactions
      .filter(
        (tx) =>
          tx.type === TransactionType.TRANSFER &&
          tx.transferTargetId === sourceId,
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    const openingBalance =
      currentBalance -
      totalInflow +
      totalOutflow +
      totalTransferOut -
      totalTransferIn;

    const sortedDates = relatedTransactions
      .map((tx) => new Date(tx.date))
      .sort((a, b) => b.getTime() - a.getTime());

    return {
      openingBalance,
      totalInflow,
      totalOutflow,
      totalTransferIn,
      totalTransferOut,
      transactionCount: relatedTransactions.length,
      lastTransactionAt: sortedDates[0],
    };
  }
}
