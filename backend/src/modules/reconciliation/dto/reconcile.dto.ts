import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReconcileEntryDto {
  @ApiProperty({ example: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  sourceId: string;

  @ApiProperty({ example: 250000, minimum: 0 })
  @IsNumber()
  @Min(0)
  actualBalance: number;
}

export class ReconcileDto {
  @ApiProperty({ type: [ReconcileEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReconcileEntryDto)
  entries: ReconcileEntryDto[];
}
