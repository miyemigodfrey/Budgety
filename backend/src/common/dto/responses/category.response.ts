import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from '../../interfaces/category.interface';

export class CategoryResponseDto {
  @ApiProperty({ example: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890' })
  userId: string;

  @ApiProperty({ example: 'Food & Dining' })
  name: string;

  @ApiProperty({ enum: CategoryType, example: CategoryType.EXPENSE })
  type: CategoryType;
}
