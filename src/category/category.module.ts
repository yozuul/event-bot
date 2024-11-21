import { Module } from '@nestjs/common';

import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { categoryProviders } from './category.provider';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, ...categoryProviders],
  exports: [CategoryService, ...categoryProviders],
})
export class CategoryModule {}
