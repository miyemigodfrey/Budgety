import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CategoryType } from '../../../common/interfaces';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Groceries', minLength: 1 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ enum: CategoryType, example: CategoryType.INCOME })
  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;
}
