import { Module } from '@nestjs/common';

import { DatabaseModule } from '@db/database.module';
import { TranslationsService } from './translations.service';
import { translationProviders } from './translations.provider';

@Module({
  providers: [TranslationsService, ...translationProviders],
  exports: [TranslationsService, ...translationProviders],
})
export class TranslationsModule {}
