import { Module } from '@nestjs/common';

import { CategoryService } from './category.service';
import { categoryProviders } from './category.provider';

@Module({
  providers: [CategoryService, ...categoryProviders],
  exports: [CategoryService, ...categoryProviders],
})
export class CategoryModule {}
