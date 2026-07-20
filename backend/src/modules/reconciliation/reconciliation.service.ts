import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../../common/services/storage.service';
import { ReconcileDto } from './dto/reconcile.dto';
import { IReconciliation } from '../../common/interfaces';
import { computeOpeningBalance } from '../../common/utils/balance.util';

@Injectable()
export class ReconciliationService {
  constructor(private readonly storage: StorageService) {}

  reconcile(dto: ReconcileDto, userId: string) {
    const results: IReconciliation[] = [];

    for (const entry of dto.entries) {
      const source = this.storage.findSourceById(entry.sourceId, userId);
      if (!source) {
        throw new NotFoundException(`Source ${entry.sourceId} not found`);
      }

      const record: IReconciliation = {
        id: crypto.randomUUID(),
        userId,
        sourceId: entry.sourceId,
        actualBalance: entry.actualBalance,
        appBalance: source.balance,
        discrepancy: entry.actualBalance - source.balance,
        reconciledAt: new Date(),
      };

      this.storage.upsertReconciliation(record);
      results.push(record);
    }

    return results.map((r) => ({
      ...r,
      sourceName:
        this.storage.findSourceById(r.sourceId, userId)?.name ?? r.sourceId,
    }));
  }

  getDiscrepancies(userId: string) {
    const records = this.storage.findReconciliationsByUserId(userId);
    const sources = this.storage.findSourcesByUserId(userId);

    return records.map((r) => {
      const source = sources.find((s) => s.id === r.sourceId);
      // Recalculate discrepancy against current app balance
      const currentAppBalance = source?.balance ?? 0;
      return {
        sourceId: r.sourceId,
        sourceName: source?.name ?? r.sourceId,
        actualBalance: r.actualBalance,
        appBalance: currentAppBalance,
        discrepancy: r.actualBalance - currentAppBalance,
        reconciledAt: r.reconciledAt,
      };
    });
  }

  getSourceSummary(sourceId: string, userId: string) {
    const source = this.storage.findSourceById(sourceId, userId);
    if (!source) throw new NotFoundException('Source not found');

    const latestRecord = this.storage
      .findReconciliationsByUserId(userId)
      .filter((record) => record.sourceId === sourceId)
      .sort(
        (a, b) =>
          new Date(b.reconciledAt).getTime() -
          new Date(a.reconciledAt).getTime(),
      )[0];

    const openingBalance = computeOpeningBalance(
      sourceId,
      source.balance,
      this.storage.findTransactionsByUserId(userId),
    );

    return {
      sourceId: source.id,
      sourceName: source.name,
      openingBalance,
      appBalance: source.balance,
      actualBalance: latestRecord?.actualBalance,
      discrepancy: latestRecord
        ? latestRecord.actualBalance - source.balance
        : undefined,
      lastReconciledAt: latestRecord?.reconciledAt,
    };
  }

}
