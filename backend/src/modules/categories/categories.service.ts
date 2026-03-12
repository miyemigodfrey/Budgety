import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StorageService } from '../../common/services/storage.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ICategory } from '../../common/interfaces';

@Injectable()
export class CategoriesService {
  constructor(private readonly storage: StorageService) {}

  findAll(userId: string): ICategory[] {
    return this.storage.findCategoriesByUserId(userId);
  }

  create(dto: CreateCategoryDto, userId: string): ICategory {
    const existing = this.storage
      .findCategoriesByUserId(userId)
      .find(
        (c) =>
          c.name.toLowerCase() === dto.name.toLowerCase() &&
          c.type === dto.type,
      );
    if (existing) {
      throw new BadRequestException(
        'Category with this name and type already exists',
      );
    }

    const category: ICategory = {
      id: crypto.randomUUID(),
      userId,
      name: dto.name,
      type: dto.type,
    };
    return this.storage.createCategory(category);
  }

  update(id: string, dto: UpdateCategoryDto, userId: string): ICategory {
    const updated = this.storage.updateCategory(id, userId, dto);
    if (!updated) throw new NotFoundException('Category not found');
    return updated;
  }

  delete(id: string, userId: string): void {
    const deleted = this.storage.deleteCategory(id, userId);
    if (!deleted) throw new NotFoundException('Category not found');
  }
}
