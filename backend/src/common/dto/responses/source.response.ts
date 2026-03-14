import { ApiProperty } from '@nestjs/swagger';
import { TransactionResponseDto } from './transaction.response';

export class SourceResponseDto {
  @ApiProperty({ example: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890' })
  userId: string;

  @ApiProperty({ example: 'GTBank' })
  name: string;

  @ApiProperty({ example: 250000 })
  balance: number;

  @ApiProperty({ example: 'NGN' })
  currency: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SourceDetailResponseDto extends SourceResponseDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  transactions: TransactionResponseDto[];
}
