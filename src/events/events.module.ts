import { Module } from '@nestjs/common';

import { UsersModule } from '@app/users/users.module';
import { EventsService } from './events.service';
import { eventsProviders } from './events.provider';

@Module({
  imports: [UsersModule],
  providers: [EventsService, ...eventsProviders],
  exports: [EventsService, ...eventsProviders],
})
export class EventsModule {}
