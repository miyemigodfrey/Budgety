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
  @IsUUID()
  sourceId: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsUUID()
  transferTargetId?: string;
}
