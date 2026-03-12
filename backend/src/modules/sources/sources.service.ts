import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../../common/services/storage.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { ISource } from '../../common/interfaces';

@Injectable()
export class SourcesService {
  constructor(private readonly storage: StorageService) {}

  findAll(userId: string): ISource[] {
    return this.storage.findSourcesByUserId(userId);
  }

  findOne(id: string, userId: string) {
    const source = this.storage.findSourceById(id, userId);
    if (!source) throw new NotFoundException('Source not found');

    const transactions = this.storage.findTransactionsBySourceId(id, userId);
    return { ...source, transactions };
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
}
