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

   async createStarted() {
      const current = await this.findAll()
      const started = [
         { ru: 'Кино 🎥', uz: 'Кино 🎥' },
         { ru: 'Вечеринки 🎉', uz: 'Тунги кечалар 🎉' },
         { ru: 'Открытие ✂️', uz: 'Очилиш ✂️' },
         { ru: 'Театры 🎭', uz: 'Театрлар 🎭' },
         { ru: 'Цирк 🎪', uz: 'Сирк 🎪' },
         { ru: 'Концерты 🎵', uz: 'Концертлар 🎵' },
         { ru: 'Бизнес 💼', uz: 'Бизнес 💼' },
         { ru: 'Выставки 🖼️', uz: 'Кўргазмалар 🖼️' },
         { ru: 'Игры 🎮', uz: 'Ўйинлар 🎮' },
         { ru: 'Кэмпинг 🏕️', uz: 'Табиатда дам олиш 🏕️' },
      ]
      if(current.length === 0) {
         await this.categoryRepository.bulkCreate(started)
      }
   }
}
