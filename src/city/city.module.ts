import { Module } from '@nestjs/common';

import { TranslationsModule } from '@app/translations/translations.module';
import { CityController } from './city.controller';
import { CityService } from './city.service';
import { cityProviders } from './city.provider';
import {TranslationsService} from '@app/translations/translations.service';

@Module({
  imports: [TranslationsModule],
  controllers: [CityController],
  providers: [CityService, ...cityProviders],
  exports: [CityService, ...cityProviders],
})
export class CityModule {}
