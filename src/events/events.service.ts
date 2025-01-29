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


   async findAllEventsIds(published?, categoryId?, date?, admin?) {
      const whereConditions: any = {};

      // Если notPublished == true, ищем только с published: false
      if (published !== undefined) {
         whereConditions.published = published ? true : false;
      }

      // Если задан categoryId, добавляем это условие
      if (categoryId) {
         whereConditions.categoryId = categoryId;
      }

      // Если указана дата, добавляем условие на fullDate или на пересечение диапазонов
      if (date) {
         const [day, month, year] = date.split('.').map(Number); // Преобразуем строку в числа
         const startDate = new Date(year, month - 1, day); // Начало дня
         const endDate = new Date(year, month - 1, day + 1); // Конец дня (00:00 следующего дня)

         whereConditions[Op.or] = [
            // Сравнение с полем fullDate
            {
               fullDate: {
                  [Op.gte]: startDate.toISOString(),
                  [Op.lt]: endDate.toISOString(),
               },
            },
            // Пересечение с диапазоном dateRawBegin и dateRawEnd
            {
               [Op.and]: [
                  {
                     dateRawBegin: { [Op.lte]: endDate.toISOString() }, // Начало <= конец выбранного дня
                  },
                  {
                     dateRawEnd: { [Op.gte]: startDate.toISOString() }, // Конец >= начало выбранного дня
                  },
               ],
            },
         ];
      }

      // Выполняем запрос
      const events = await this.eventsRepository.findAll({
         where: whereConditions,
         order: [['fullDate', 'ASC']],
         attributes: ['id'],
         raw: true,
      });

      const eventsIds = events.map((event) => event.id);
      let firstEvent = null;
      if (events.length > 0) {
         firstEvent = await this.findById(eventsIds[0]);
      }

      return { eventsIds, firstEvent };
   }

   async findById(id) {
      return this.eventsRepository.findOne({
         where: { id },
         raw: true
      });
   }

   async findByIdAndSave(id) {
      return this.eventsRepository.findOne({
         where: { id }
      });
   }

   async findAllUsersEvents(tgId) {
      const userService = await this.userService.findByTgId(tgId)
      const events = await this.eventsRepository.findAll({
         where: {
            // published: true,
            userId: userService.id,
         },
         order: [['fullDate', 'ASC']],
      });
      const eventsIds = events.map(event => event.id)
      let firstEvent = null
      if(events.length > 0) {
         firstEvent = await this.findById(eventsIds[0])
      }
      return { eventsIds, firstEvent }
   }

   async findClosestUpcomingEvent(tgId) {
      const userService = await this.userService.findByTgId(tgId)
      const now = new Date();
      const event = await this.eventsRepository.findOne({
         where: {
            fullDate: { [Op.gt]: now }, // События после текущей даты
         },
         order: [['fullDate', 'ASC']], // Сортировка по возрастанию даты
         raw: true
      });
      const totalCount = await this.eventsRepository.count({
         where: { fullDate: { [Op.gt]: now } },
      });
      let canSave = false
      let nextEvent = null
      if(event) {
         const checkNext = await this.findNextEvent(event.id)
         nextEvent = checkNext ? checkNext?.nextEvent?.id : null
      }
      if(userService?.id === event?.userId) {
         canSave = true
      }
      return { event, totalCount, nextEvent, canSave };
   }

   /**
    * Найти следующее событие по дате.
    */
   async findNextEvent(currentId: string) {
      // Находим текущее событие
      const currentEvent = await this.eventsRepository.findOne({
         where: { id: currentId },
         raw: true,
      });
      if (!currentEvent) {
         throw new Error('Текущее событие не найдено');
      }
      // Получаем все события, отсортированные по дате
      const allEvents = await this.eventsRepository.findAll({
         where: {
            fullDate: { [Op.gt]: new Date() }, // Только будущие события
         },
         order: [['fullDate', 'ASC']], // Сортировка по возрастанию даты
         raw: true,
      });

      const totalCount = allEvents.length;
      // Находим индекс текущего события
      const currentIndex = allEvents.findIndex(event => event.id === currentId);
      // Следующее событие
      const nextEvent = allEvents[currentIndex + 1] || null;
      const nextEventPosition = nextEvent ? currentIndex + 2 : null; // Позиция следующего
      return {
         nextEvent, // Следующее событие
         nextEventPosition, // Позиция следующего события (2/3)
         totalCount, // Общее количество событий
      };
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
      try {
         const user = await this.userService.findByTgId(tgId)
         event.userId = user.id
         const newEvent = await this.eventsRepository.create(event)
         return newEvent
      } catch (error) {
         console.log(error)
         console.log('Ошибка добавления мероприятия')
      }
   }

   async deleteEvent(eventId) {
      try {
         await this.eventsRepository.destroy({
            where: { id: eventId }
         })
      } catch (error) {
         console.log('Ошибка удаления мероприятия')
      }
   }

   async approveEvent(eventId) {
      try {
         const event = await this.eventsRepository.findOne({
            where: { id: eventId }
         })
         event.decline = false
         event.published = true
         await event.save()
      } catch (error) {
         console.log('Ошибка подтверждения мероприятия')
      }
   }

   async declineEvent(eventId) {
      try {
         const event = await this.eventsRepository.findOne({
            where: { id: eventId }
         })
         event.decline = true
         await event.save()
      } catch (error) {
         console.log('Ошибка отклонения мероприятия')
      }
   }

   async updateEvent(event) {
      const eventId = event.id || event.eventId
      let editEvent = event
      if(editEvent.id) delete editEvent.id
      try {
         await this.eventsRepository.update(editEvent, {
            where: { id: eventId }
         })
      } catch (error) {
         console.log(error)
         console.log('Ошибка сохранения мероприятия')
      }
   }

   async findEventById(eventId) {
      return this.eventsRepository.findOne({
         where: { id: eventId }
      })
   }
}
