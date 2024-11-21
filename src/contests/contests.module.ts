import { Module } from '@nestjs/common';

import { DatabaseModule } from '@db/database.module';
import { ContestsController } from './contests.controller';
import { ContestsService } from './contests.service';
import { contestProviders } from './contests.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [ContestsController],
  providers: [ContestsService, ...contestProviders]
})
export class ContestsModule {}