import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../../common/services/storage.service';
import { generateTransactionsPdf } from '../../common/utils/pdf.util';
import { TransactionType } from '../../common/interfaces';

@Injectable()
export class ExportService {
  constructor(private readonly storage: StorageService) {}

  getSummary(userId: string, months: number) {
    const boundedMonths = Math.min(Math.max(months, 1), 24);
    const sources = this.storage.findSourcesByUserId(userId);
    const sourceById = new Map(sources.map((source) => [source.id, source]));
    const transactions = this.storage.findTransactionsByUserId(userId);

    const totalBalance = sources.reduce(
      (sum, source) => sum + source.balance,
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

    const monthWindows = this.getMonthWindows(boundedMonths);

    const totalTransactionsSeries = monthWindows.map((window) => {
      const monthTransactions = transactions.filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate >= window.start && txDate <= window.end;
      });

      const total = monthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      return {
        period: window.key,
        total,
      };
    });

    const breakdownSeries = monthWindows.map((window) => {
      const sourceTotals = sources.map((source) => {
        const amount = transactions
          .filter((tx) => {
            const txDate = new Date(tx.date);
            const inMonth = txDate >= window.start && txDate <= window.end;
            const related =
              tx.sourceId === source.id || tx.transferTargetId === source.id;
            return inMonth && related;
          })
          .reduce((sum, tx) => sum + tx.amount, 0);

        return {
          sourceId: source.id,
          sourceName: source.name,
          amount,
        };
      });

      return {
        period: window.key,
        sources: sourceTotals,
      };
    });

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
        period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        inflow: monthlyInflow,
        outflow: monthlyOutflow,
        net: monthlyInflow - monthlyOutflow,
      },
      charts: {
        totalTransactionsSeries,
        breakdownSeries,
      },
      recentTransactions,
    };
  }

  exportCsv(userId: string, startDate?: string, endDate?: string) {
    const range = this.resolveDateRange(startDate, endDate);
    const sources = this.storage.findSourcesByUserId(userId);
    const sourceById = new Map(sources.map((source) => [source.id, source]));

    const transactions = this.storage
      .findTransactionsByUserId(userId)
      .filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate >= range.start && txDate <= range.end;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const header = [
      'id',
      'date',
      'type',
      'sourceId',
      'sourceName',
      'transferTargetId',
      'transferTargetName',
      'amount',
      'category',
      'note',
    ];

    const rows = transactions.map((tx) => {
      const sourceName = sourceById.get(tx.sourceId)?.name ?? tx.sourceId;
      const transferTargetName = tx.transferTargetId
        ? (sourceById.get(tx.transferTargetId)?.name ?? tx.transferTargetId)
        : '';

      return [
        tx.id,
        new Date(tx.date).toISOString(),
        tx.type,
        tx.sourceId,
        sourceName,
        tx.transferTargetId ?? '',
        transferTargetName,
        tx.amount.toString(),
        tx.category,
        tx.note,
      ]
        .map((value) => this.escapeCsv(value))
        .join(',');
    });

    const csv = [header.join(','), ...rows].join('\n');

    return {
      csv,
      range: {
        startDate: range.startDate,
        endDate: range.endDate,
      },
      rowCount: rows.length,
    };
  }

  async exportPdf(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<Buffer> {
    const sources = this.storage.findSourcesByUserId(userId);
    if (sources.length === 0) {
      throw new NotFoundException('No sources found for this user');
    }

    const user = this.storage.findUserById(userId);

    let transactions = this.storage.findTransactionsByUserId(userId);

    const { start, end } = this.resolveDateRange(startDate, endDate);

    transactions = transactions
      .filter((t) => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return generateTransactionsPdf({
      transactions,
      sources,
      startDate,
      endDate,
      userName: user?.name ?? 'User',
    });
  }

  private resolveDateRange(startDate?: string, endDate?: string) {
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now);

    const start = startDate ? new Date(startDate) : defaultStart;
    const end = endDate ? new Date(endDate) : defaultEnd;
    end.setHours(23, 59, 59, 999);

    const normalizedStartDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const normalizedEndDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;

    return {
      start,
      end,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
    };
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

  private escapeCsv(value: string) {
    const hasSpecialChars = /[",\n]/.test(value);
    const escaped = value.replace(/"/g, '""');
    return hasSpecialChars ? `"${escaped}"` : escaped;
  }
}
