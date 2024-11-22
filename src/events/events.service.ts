import { Injectable, Inject } from '@nestjs/common';
import { Event } from './events.entity';

@Injectable()
export class EventsService {
   constructor(
      @Inject('EVENTS_REPOSITORY')
      private eventsRepository: typeof Event
   ) {}

   async findAll() {
      return this.eventsRepository.findAll()
   }

   createEvent(event) {

   }


   updateEvent(event) {

   }
}
