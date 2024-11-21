import { Module } from '@nestjs/common';

import { DatabaseModule } from '@db/database.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { eventsProviders } from './events.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [EventsController],
  providers: [EventsService, ...eventsProviders],
  exports: [EventsService, ...eventsProviders],
})
export class EventsModule {}
