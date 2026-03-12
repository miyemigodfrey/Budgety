import { IsEnum, IsString, MinLength } from 'class-validator';
import { CategoryType } from '../../../common/interfaces';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(CategoryType)
  type: CategoryType;
}
