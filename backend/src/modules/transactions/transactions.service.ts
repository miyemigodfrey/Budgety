import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StorageService } from '../../common/services/storage.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ITransaction, TransactionType } from '../../common/interfaces';

@Injectable()
export class TransactionsService {
  constructor(private readonly storage: StorageService) {}

  getOverview(userId: string) {
    const sources = this.storage.findSourcesByUserId(userId);
    const transactions = this.storage.findTransactionsByUserId(userId);
    const sourceById = new Map(sources.map((source) => [source.id, source]));

    const totals = transactions.reduce(
      (acc, tx) => {
        if (tx.type === TransactionType.INFLOW) acc.inflow += tx.amount;
        if (tx.type === TransactionType.OUTFLOW) acc.outflow += tx.amount;
        if (tx.type === TransactionType.TRANSFER) acc.transfer += tx.amount;
        return acc;
      },
      { inflow: 0, outflow: 0, transfer: 0 },
    );

    const totalBalance = sources.reduce(
      (sum, source) => sum + source.balance,
      0,
    );
    const totalInitialBalance = sources.reduce(
      (sum, source) =>
        sum +
        this.computeOpeningBalance(source.id, source.balance, transactions),
      0,
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

    const monthlyTransactions = transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate >= monthStart && txDate <= monthEnd;
    });

    const monthlyInflow = monthlyTransactions
      .filter((tx) => tx.type === TransactionType.INFLOW)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const monthlyOutflow = monthlyTransactions
      .filter((tx) => tx.type === TransactionType.OUTFLOW)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const monthlyTransfer = monthlyTransactions
      .filter((tx) => tx.type === TransactionType.TRANSFER)
      .reduce((sum, tx) => sum + tx.amount, 0);

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
        period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        inflow: monthlyInflow,
        outflow: monthlyOutflow,
        transfer: monthlyTransfer,
        net: monthlyInflow - monthlyOutflow,
      },
      recentTransactions,
    };
  }

  getTrends(userId: string, months: number) {
    const boundedMonths = Math.min(Math.max(months, 1), 24);
    const sources = this.storage.findSourcesByUserId(userId);
    const transactions = this.storage.findTransactionsByUserId(userId);

    const monthWindows = this.getMonthWindows(boundedMonths);

    const totalsByMonth = monthWindows.map((window) => {
      const monthTransactions = transactions.filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate >= window.start && txDate <= window.end;
      });

      const inflow = monthTransactions
        .filter((tx) => tx.type === TransactionType.INFLOW)
        .reduce((sum, tx) => sum + tx.amount, 0);
      const outflow = monthTransactions
        .filter((tx) => tx.type === TransactionType.OUTFLOW)
        .reduce((sum, tx) => sum + tx.amount, 0);
      const transfer = monthTransactions
        .filter((tx) => tx.type === TransactionType.TRANSFER)
        .reduce((sum, tx) => sum + tx.amount, 0);

      return {
        period: window.key,
        inflow,
        outflow,
        transfer,
        total: inflow + outflow + transfer,
      };
    });

    const bySource = monthWindows.map((window) => {
      const values = sources.map((source) => {
        const monthTransactions = transactions.filter((tx) => {
          const txDate = new Date(tx.date);
          const inMonth = txDate >= window.start && txDate <= window.end;
          const belongsToSource =
            tx.sourceId === source.id || tx.transferTargetId === source.id;
          return inMonth && belongsToSource;
        });

        const inflow = monthTransactions
          .filter(
            (tx) =>
              tx.type === TransactionType.INFLOW && tx.sourceId === source.id,
          )
          .reduce((sum, tx) => sum + tx.amount, 0);

        const outflow = monthTransactions
          .filter(
            (tx) =>
              tx.type === TransactionType.OUTFLOW && tx.sourceId === source.id,
          )
          .reduce((sum, tx) => sum + tx.amount, 0);

        const transfer = monthTransactions
          .filter((tx) => tx.type === TransactionType.TRANSFER)
          .reduce((sum, tx) => sum + tx.amount, 0);

        return {
          sourceId: source.id,
          sourceName: source.name,
          inflow,
          outflow,
          transfer,
          total: inflow + outflow + transfer,
        };
      });

      return {
        period: window.key,
        values,
      };
    });

    return {
      months: boundedMonths,
      totalsByMonth,
      bySource,
    };
  }

  findAll(
    userId: string,
    filters?: {
      sourceId?: string;
      type?: TransactionType;
      startDate?: string;
      endDate?: string;
    },
  ): ITransaction[] {
    let txs = this.storage.findTransactionsByUserId(userId);

    if (filters?.sourceId) {
      txs = txs.filter(
        (t) =>
          t.sourceId === filters.sourceId ||
          t.transferTargetId === filters.sourceId,
      );
    }
    if (filters?.type) {
      txs = txs.filter((t) => t.type === filters.type);
    }
    if (filters?.startDate) {
      const start = new Date(filters.startDate);
      txs = txs.filter((t) => new Date(t.date) >= start);
    }
    if (filters?.endDate) {
      const end = new Date(filters.endDate);
      txs = txs.filter((t) => new Date(t.date) <= end);
    }

    return txs.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  create(dto: CreateTransactionDto, userId: string): ITransaction {
    const source = this.storage.findSourceById(dto.sourceId, userId);
    if (!source) throw new NotFoundException('Source not found');

    if (dto.type === TransactionType.TRANSFER) {
      if (!dto.transferTargetId) {
        throw new BadRequestException(
          'transferTargetId is required for transfers',
        );
      }
      if (dto.transferTargetId === dto.sourceId) {
        throw new BadRequestException('Cannot transfer to the same source');
      }
      const target = this.storage.findSourceById(dto.transferTargetId, userId);
      if (!target)
        throw new NotFoundException('Transfer target source not found');
    }

    // Check for negative balance on outflow / transfer
    if (
      (dto.type === TransactionType.OUTFLOW ||
        dto.type === TransactionType.TRANSFER) &&
      source.balance < dto.amount
    ) {
      throw new BadRequestException(
        `Insufficient balance in "${source.name}". Available: ${source.balance}`,
      );
    }

    // Apply balance changes
    this.applyBalanceChange(
      dto.type,
      dto.sourceId,
      dto.transferTargetId,
      dto.amount,
      userId,
    );

    const transaction: ITransaction = {
      id: crypto.randomUUID(),
      userId,
      sourceId: dto.sourceId,
      type: dto.type,
      amount: dto.amount,
      category: dto.category,
      note: dto.note ?? '',
      date: new Date(dto.date),
      transferTargetId: dto.transferTargetId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.storage.createTransaction(transaction);
  }

  update(id: string, dto: UpdateTransactionDto, userId: string): ITransaction {
    const existing = this.storage.findTransactionById(id, userId);
    if (!existing) throw new NotFoundException('Transaction not found');

    // Build the "new" complete state by merging existing + dto
    const newType = dto.type ?? existing.type;
    const newSourceId = dto.sourceId ?? existing.sourceId;
    const newAmount = dto.amount ?? existing.amount;
    const newTargetId = dto.transferTargetId ?? existing.transferTargetId;

    // Validate new sources exist
    const newSource = this.storage.findSourceById(newSourceId, userId);
    if (!newSource) throw new NotFoundException('Source not found');

    if (newType === TransactionType.TRANSFER) {
      if (!newTargetId) {
        throw new BadRequestException(
          'transferTargetId is required for transfers',
        );
      }
      if (newTargetId === newSourceId) {
        throw new BadRequestException('Cannot transfer to the same source');
      }
      const target = this.storage.findSourceById(newTargetId, userId);
      if (!target)
        throw new NotFoundException('Transfer target source not found');
    }

    // Step 1: Reverse old transaction effects
    this.reverseBalanceChange(
      existing.type,
      existing.sourceId,
      existing.transferTargetId,
      existing.amount,
      userId,
    );

    // Step 2: Check if new state would cause negative balance
    const sourceAfterReverse = this.storage.findSourceById(
      newSourceId,
      userId,
    )!;
    if (
      (newType === TransactionType.OUTFLOW ||
        newType === TransactionType.TRANSFER) &&
      sourceAfterReverse.balance < newAmount
    ) {
      // Rollback: re-apply original
      this.applyBalanceChange(
        existing.type,
        existing.sourceId,
        existing.transferTargetId,
        existing.amount,
        userId,
      );
      throw new BadRequestException(
        `Insufficient balance in "${sourceAfterReverse.name}" after edit. Available: ${sourceAfterReverse.balance}`,
      );
    }

    // Step 3: Apply new transaction effects
    this.applyBalanceChange(
      newType,
      newSourceId,
      newTargetId,
      newAmount,
      userId,
    );

    // Step 4: Persist update
    const updates: Partial<ITransaction> = {};
    if (dto.type !== undefined) updates.type = dto.type;
    if (dto.sourceId !== undefined) updates.sourceId = dto.sourceId;
    if (dto.amount !== undefined) updates.amount = dto.amount;
    if (dto.category !== undefined) updates.category = dto.category;
    if (dto.note !== undefined) updates.note = dto.note;
    if (dto.date !== undefined) updates.date = new Date(dto.date);
    if (dto.transferTargetId !== undefined)
      updates.transferTargetId = dto.transferTargetId;

    return this.storage.updateTransaction(id, userId, updates)!;
  }

  delete(id: string, userId: string): void {
    const existing = this.storage.findTransactionById(id, userId);
    if (!existing) throw new NotFoundException('Transaction not found');

    // Check if reversing would cause negative balance on inflow reversal
    if (existing.type === TransactionType.INFLOW) {
      const source = this.storage.findSourceById(existing.sourceId, userId);
      if (source && source.balance < existing.amount) {
        throw new BadRequestException(
          `Cannot delete: reversing this inflow would cause negative balance in "${source.name}"`,
        );
      }
    }
    if (
      existing.type === TransactionType.TRANSFER &&
      existing.transferTargetId
    ) {
      const target = this.storage.findSourceById(
        existing.transferTargetId,
        userId,
      );
      if (target && target.balance < existing.amount) {
        throw new BadRequestException(
          `Cannot delete: reversing this transfer would cause negative balance in "${target.name}"`,
        );
      }
    }

    this.reverseBalanceChange(
      existing.type,
      existing.sourceId,
      existing.transferTargetId,
      existing.amount,
      userId,
    );
    this.storage.deleteTransaction(id, userId);
  }

  // ── Private helpers ────────────────────────────────────────────────

  private applyBalanceChange(
    type: TransactionType,
    sourceId: string,
    targetId: string | undefined,
    amount: number,
    userId: string,
  ) {
    switch (type) {
      case TransactionType.INFLOW:
        this.storage.updateSource(sourceId, userId, {
          balance: this.getBalance(sourceId, userId) + amount,
        });
        break;
      case TransactionType.OUTFLOW:
        this.storage.updateSource(sourceId, userId, {
          balance: this.getBalance(sourceId, userId) - amount,
        });
        break;
      case TransactionType.TRANSFER:
        this.storage.updateSource(sourceId, userId, {
          balance: this.getBalance(sourceId, userId) - amount,
        });
        if (targetId) {
          this.storage.updateSource(targetId, userId, {
            balance: this.getBalance(targetId, userId) + amount,
          });
        }
        break;
    }
  }

  private reverseBalanceChange(
    type: TransactionType,
    sourceId: string,
    targetId: string | undefined,
    amount: number,
    userId: string,
  ) {
    switch (type) {
      case TransactionType.INFLOW:
        this.storage.updateSource(sourceId, userId, {
          balance: this.getBalance(sourceId, userId) - amount,
        });
        break;
      case TransactionType.OUTFLOW:
        this.storage.updateSource(sourceId, userId, {
          balance: this.getBalance(sourceId, userId) + amount,
        });
        break;
      case TransactionType.TRANSFER:
        this.storage.updateSource(sourceId, userId, {
          balance: this.getBalance(sourceId, userId) + amount,
        });
        if (targetId) {
          this.storage.updateSource(targetId, userId, {
            balance: this.getBalance(targetId, userId) - amount,
          });
        }
        break;
    }
  }

  private getBalance(sourceId: string, userId: string): number {
    return this.storage.findSourceById(sourceId, userId)?.balance ?? 0;
  }

  private computeOpeningBalance(
    sourceId: string,
    currentBalance: number,
    transactions: ITransaction[],
  ): number {
    const related = transactions.filter(
      (tx) => tx.sourceId === sourceId || tx.transferTargetId === sourceId,
    );

    const inflow = related
      .filter(
        (tx) => tx.type === TransactionType.INFLOW && tx.sourceId === sourceId,
      )
      .reduce((sum, tx) => sum + tx.amount, 0);
    const outflow = related
      .filter(
        (tx) => tx.type === TransactionType.OUTFLOW && tx.sourceId === sourceId,
      )
      .reduce((sum, tx) => sum + tx.amount, 0);
    const transferOut = related
      .filter(
        (tx) =>
          tx.type === TransactionType.TRANSFER && tx.sourceId === sourceId,
      )
      .reduce((sum, tx) => sum + tx.amount, 0);
    const transferIn = related
      .filter(
        (tx) =>
          tx.type === TransactionType.TRANSFER &&
          tx.transferTargetId === sourceId,
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    return currentBalance - inflow + outflow + transferOut - transferIn;
  }

  private getMonthWindows(months: number) {
    const now = new Date();
    const windows: Array<{ key: string; start: Date; end: Date }> = [];

    for (let offset = months - 1; offset >= 0; offset -= 1) {
      const year = now.getFullYear();
      const month = now.getMonth() - offset;
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      windows.push({
        key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
        start,
        end,
      });
    }

    return windows;
  }
}
