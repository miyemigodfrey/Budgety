import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../../interfaces/transaction.interface';

export class TransactionResponseDto {
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

  @ApiProperty({ example: 'Weekly grocery shopping' })
  note: string;

  @ApiProperty()
  date: Date;

  @ApiPropertyOptional({ example: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890' })
  transferTargetId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
