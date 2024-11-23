import { Injectable, Inject } from '@nestjs/common';
import { Op } from 'sequelize';

import { Event } from './events.entity';
import { UsersService } from '@app/users/users.service';

@Injectable()
export class EventsService {
   constructor(
      @Inject('EVENTS_REPOSITORY')
      private eventsRepository: typeof Event,
      private readonly userService: UsersService
   ) {}

   async findClosestUpcomingEvent() {
      const now = new Date();
      const event = await this.eventsRepository.findOne({
         where: {
            fullDate: { [Op.gt]: now }, // События после текущей даты
         },
         order: [['fullDate', 'ASC']], // Сортировка по возрастанию даты
      });

      const totalCount = await this.eventsRepository.count({
         where: { fullDate: { [Op.gt]: now } },
      });

      return { event, totalCount };
   }

   /**
    * Найти следующее событие по дате.
    */
   async findNextEvent(currentId: string) {
      const event = await this.eventsRepository.findOne({
         where: {
            id: { [Op.ne]: currentId }, // Исключить текущее событие
            fullDate: { [Op.gt]: new Date() },
         },
         order: [['fullDate', 'ASC']],
      });

      const totalCount = await this.eventsRepository.count();
      return { event, totalCount };
   }

   /**
    * Найти ближайшее событие пользователя, которое еще не прошло.
    */
   async findUsersClosestUpcomingEvent(tgId: string | number) {
      const user = await this.userService.findByTgId(tgId)
      const userId = user.id
      const now = new Date();
      const event = await this.eventsRepository.findOne({
         where: {
            userId,
            fullDate: { [Op.gt]: now },
         },
         order: [['fullDate', 'ASC']],
      });
      const totalCount = await this.eventsRepository.count({
         where: { userId },
      });
      return { event, totalCount };
   }

   /**
    * Найти следующее событие пользователя.
    */
   async findUsersNextEvent(tgId: string | number, currentId: string) {
      const user = await this.userService.findByTgId(tgId)
      const userId = user.id
      const event = await this.eventsRepository.findOne({
         where: {
            userId,
            id: { [Op.ne]: currentId },
            fullDate: { [Op.gt]: new Date() },
         },
         order: [['fullDate', 'ASC']],
      });

      const totalCount = await this.eventsRepository.count({
         where: { userId },
      });

      return { event, totalCount };
   }

   async createEvent(event, tgId) {
      const user = await this.userService.findByTgId(tgId)
      const newEvent = await this.eventsRepository.create({
         ...event, userId: user.id
      })
      console.log(newEvent)
   }
   updateEvent(event) {

   }
}
