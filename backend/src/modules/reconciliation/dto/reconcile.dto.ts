import {
  IsArray,
  IsNumber,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReconcileEntryDto {
  @IsUUID()
  sourceId: string;

  @IsNumber()
  @Min(0)
  actualBalance: number;
}

export class ReconcileDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReconcileEntryDto)
  entries: ReconcileEntryDto[];
}
