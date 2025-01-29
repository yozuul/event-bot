import { Module } from '@nestjs/common';

import { AdwerstingService } from './adwersting.service';
import { adwerstingProviders } from './adwersting.provider';

@Module({
  providers: [AdwerstingService, ...adwerstingProviders],
  exports: [AdwerstingService, ...adwerstingProviders],
})
export class AdwerstingModule {}


