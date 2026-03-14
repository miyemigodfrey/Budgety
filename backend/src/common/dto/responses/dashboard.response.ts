import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../../interfaces/transaction.interface';

export class DashboardSourceSummaryDto {
  @ApiProperty({ example: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'GTBank' })
  name: string;

  @ApiProperty({ example: 250000 })
  balance: number;

  @ApiProperty({ example: 'NGN' })
  currency: string;
}

export class DashboardMonthlyDto {
  @ApiProperty({ example: '2026-03' })
  period: string;

  @ApiProperty({ example: 450000 })
  inflow: number;

  @ApiProperty({ example: 180000 })
  outflow: number;

  @ApiProperty({ example: 270000 })
  net: number;
}

export class DashboardRecentTransactionDto {
  @ApiProperty({ example: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890' })
  userId: string;

  @ApiProperty({ example: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890' })
  sourceId: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.INFLOW })
  type: TransactionType;

  @ApiProperty({ example: 15000 })
  amount: number;

  @ApiProperty({ example: 'Food & Groceries' })
  category: string;

  @ApiProperty({ example: 'Weekly shopping' })
  note: string;

  @ApiProperty()
  date: Date;

  @ApiPropertyOptional()
  transferTargetId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ example: 'GTBank' })
  sourceName: string;

  @ApiPropertyOptional({ example: 'Piggy Vest' })
  transferTargetName?: string;
}

export class DashboardResponseDto {
  @ApiProperty({ example: 362000 })
  totalBalance: number;

  @ApiProperty({ type: [DashboardSourceSummaryDto] })
  sources: DashboardSourceSummaryDto[];

  @ApiProperty({ type: DashboardMonthlyDto })
  monthly: DashboardMonthlyDto;

  @ApiProperty({ type: [DashboardRecentTransactionDto] })
  recentTransactions: DashboardRecentTransactionDto[];
}
