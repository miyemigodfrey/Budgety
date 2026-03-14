import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { CategoryType } from '../../../common/interfaces';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Food & Dining', minLength: 1 })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ enum: CategoryType, example: CategoryType.EXPENSE })
  @IsEnum(CategoryType)
  type: CategoryType;
}
