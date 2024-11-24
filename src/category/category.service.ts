import { Injectable, Inject } from '@nestjs/common';
import { Category } from './category.entity';

@Injectable()
export class CategoryService {
   constructor(
      @Inject('CATEGORY_REPOSITORY')
      private categoryRepository: typeof Category
   ) {}

   async findAll(): Promise<Category[]> {
      return this.categoryRepository.findAll<Category>();
   }

   async findById(categoryId) {
      console.log('categoryId', categoryId)
      return this.categoryRepository.findOne({
         where: { id: categoryId }
      })
   }
   async create(data) {
      return this.categoryRepository.create(data)
   }
   async delete(categoryId) {
      return this.categoryRepository.destroy({
         where: { id: categoryId }
      })
   }

   async update(data) {
      return this.categoryRepository.update(data, {
         where: { id: data.id }
      })
   }
}
