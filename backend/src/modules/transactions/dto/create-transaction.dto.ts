import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { TransactionType } from '../../../common/interfaces';

export class CreateTransactionDto {
  @ApiProperty({ example: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  sourceId: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.INFLOW })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ example: 15000, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'Food & Groceries' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ example: 'Weekly grocery shopping' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ example: '2026-03-14' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    example: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Required when type is "transfer"',
  })
  @IsOptional()
  @IsUUID()
  transferTargetId?: string;
}
