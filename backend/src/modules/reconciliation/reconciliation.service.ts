import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../../common/services/storage.service';
import { ReconcileDto } from './dto/reconcile.dto';
import { IReconciliation } from '../../common/interfaces';

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
}
