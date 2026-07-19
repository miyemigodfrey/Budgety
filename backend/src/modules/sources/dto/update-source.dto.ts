import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateSourceDto {
  @ApiPropertyOptional({ example: 'GTBank Savings', minLength: 1 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  /**
   * Corrects the source's current balance directly (e.g. the opening figure
   * was entered wrong). Transactions are left untouched — the derived
   * opening balance shifts by the same amount.
   */
  @ApiPropertyOptional({ example: 214000, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;
}
