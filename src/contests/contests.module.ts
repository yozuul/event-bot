import { Module } from '@nestjs/common';

import { DatabaseModule } from '@db/database.module';
import { ContestsService } from './contests.service';
import { contestProviders } from './contests.provider';

@Module({
  imports: [DatabaseModule],
  providers: [ContestsService, ...contestProviders]
})
export class ContestsModule {}