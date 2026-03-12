import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CategoryType } from '../../../common/interfaces';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;
}
