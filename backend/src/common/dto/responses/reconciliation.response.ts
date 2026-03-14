import { ApiProperty } from '@nestjs/swagger';

export class ReconcileResultDto {
  @ApiProperty({ example: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890' })
  userId: string;

  @ApiProperty({ example: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890' })
  sourceId: string;

  @ApiProperty({ example: 250000 })
  actualBalance: number;

  @ApiProperty({ example: 248500 })
  appBalance: number;

  @ApiProperty({ example: 1500 })
  discrepancy: number;

  @ApiProperty()
  reconciledAt: Date;

  @ApiProperty({ example: 'GTBank' })
  sourceName: string;
}

export class DiscrepancyResponseDto {
  @ApiProperty({ example: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890' })
  sourceId: string;

  @ApiProperty({ example: 'GTBank' })
  sourceName: string;

  @ApiProperty({ example: 250000 })
  actualBalance: number;

  @ApiProperty({ example: 248500 })
  appBalance: number;

  @ApiProperty({ example: 1500 })
  discrepancy: number;

  @ApiProperty()
  reconciledAt: Date;
}
