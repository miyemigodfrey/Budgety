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
}
