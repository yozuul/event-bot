import { Module } from '@nestjs/common';

import { UsersModule } from '@app/users/users.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { eventsProviders } from './events.provider';

@Module({
  imports: [UsersModule],
  controllers: [EventsController],
  providers: [EventsService, ...eventsProviders],
  exports: [EventsService, ...eventsProviders],
})
export class EventsModule {}
