import { Injectable } from '@nestjs/common';
import { StorageService } from '../../common/services/storage.service';
import { TransactionType } from '../../common/interfaces';

@Injectable()
export class DashboardService {
  constructor(private readonly storage: StorageService) {}

  getDashboard(userId: string) {
    const sources = this.storage.findSourcesByUserId(userId);
    const transactions = this.storage.findTransactionsByUserId(userId);

    // Totals per source
    const sourcesSummary = sources.map((s) => ({
      id: s.id,
      name: s.name,
      balance: s.balance,
      currency: s.currency,
    }));

    const totalBalance = sources.reduce((sum, s) => sum + s.balance, 0);

    // Monthly inflow / outflow (current month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const monthlyTxs = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= monthStart && d <= monthEnd;
    });

    const monthlyInflow = monthlyTxs
      .filter((t) => t.type === TransactionType.INFLOW)
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyOutflow = monthlyTxs
      .filter((t) => t.type === TransactionType.OUTFLOW)
      .reduce((sum, t) => sum + t.amount, 0);

    // Recent transactions (last 10)
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map((t) => ({
        ...t,
        sourceName:
          sources.find((s) => s.id === t.sourceId)?.name ?? t.sourceId,
        transferTargetName: t.transferTargetId
          ? (sources.find((s) => s.id === t.transferTargetId)?.name ??
            t.transferTargetId)
          : undefined,
      }));

    return {
      totalBalance,
      sources: sourcesSummary,
      monthly: {
        period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        inflow: monthlyInflow,
        outflow: monthlyOutflow,
        net: monthlyInflow - monthlyOutflow,
      },
      recentTransactions,
    };
  }
}
