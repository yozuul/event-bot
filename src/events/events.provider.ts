import { Event } from './events.entity';

export const eventsProviders = [
   {
      provide: 'EVENTS_REPOSITORY',
      useValue: Event,
   },
];