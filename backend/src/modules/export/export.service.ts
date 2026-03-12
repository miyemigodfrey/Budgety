import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../../common/services/storage.service';
import { generateTransactionsPdf } from '../../common/utils/pdf.util';

@Injectable()
export class ExportService {
  constructor(private readonly storage: StorageService) {}

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

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

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
}
