import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action, Command, On, Message, Start } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { EventsKeyboard } from '../keyboards';
import { UsersService } from '@app/users/users.service';
import { BotService } from '../bot.service';
import { EventsService } from '@app/events/events.service';
import { EventCreateScene } from './event-create.scene';

@Scene('EVENTS_LIST_SCENE')
@Injectable()
export class EventsScene {
   constructor(
      private readonly botService: BotService,
      private readonly userService: UsersService,
      private readonly eventsService: EventsService,
      private readonly eventCreateScene: EventCreateScene,
      private readonly eventsKeyboard: EventsKeyboard
   ) {}

   @SceneEnter()
   async onSceneEnter(@Ctx() ctx: Context) {
      await this.botService.sceneEnterCleaner(ctx)
      await this.checkEvents(ctx)
   }


   async checkEvents(@Ctx() ctx: Context) {
      const lang = ctx.session.language
      const user = await this.userService.findByTgId(ctx.from.id)
      ctx.session.user.admin = user.admin
      ctx.session.user.name = user.name
      ctx.session.eventNavigation = {
         allEvents: [], current: '', totalCount: 0,
      };
      if(ctx.session.query === 'showCategory') {
         console.log('showCategory')
         const data = await this.eventsService.findAllEventsIds('noPublished', ctx.session.showCategory)
         if(!data.firstEvent) {
            await this.showNoEventsKeyboard(ctx, lang)
         }
         if(data.firstEvent) {
            await this.showEventsList(ctx, data)
         }
      }
      if(ctx.session.query === 'showModerateEvents') {
         console.log('showModerateEvents')
         const data = await this.eventsService.findAllEventsIds('noPublished')
         if(!data.firstEvent) {
            const msg = await ctx.reply('Мероприятия на модерации не найдены')
            ctx.session.messageToDelete.push(msg.message_id)
         }
         if(data.firstEvent) {
            await this.showEventsList(ctx, data)
         }
      }
      if(!ctx.session.query || ctx.session.query === 'showAllEvents') {
         console.log('showAllEvents')
         const data = await this.eventsService.findAllEventsIds(false)
         if(!data.firstEvent) {
            await this.showNoEventsKeyboard(ctx, lang)
         }
         if(data.firstEvent) {
            await this.showEventsList(ctx, data)
         }
      }
      if(ctx.session.query === 'showAllUsersEvents') {
         console.log('showAllUsersEvents')
         const data = await this.eventsService.findAllUsersEvents(ctx.from.id)
         if(!data.firstEvent) {
            await this.showNoUserEventsKeyboard(ctx, lang)
         }
         if(data.firstEvent) {
            await this.showEventsList(ctx, data)
         }
      }
   }

   async showEventsList(@Ctx() ctx: Context, data) {
      const lang = ctx.session.language
      ctx.session.eventNavigation.allEvents = data.eventsIds
      ctx.session.eventNavigation.current = data.firstEvent.id
      ctx.session.eventNavigation.totalCount = data.eventsIds.length
      ctx.session.currentEvent = data.firstEvent
      ctx.session.currentEvent.eventId = data.firstEvent.id
      ctx.session.currentEvent.title = ''
      const eventText = await this.eventCreateScene.genEventText(ctx)
      const msg = await ctx.replyWithPhoto(
         ctx.session.currentEvent.photo || 'https://via.placeholder.com/300',
         {
            caption: eventText,
            reply_markup: {
               inline_keyboard: this.eventsKeyboard.viewer(
                  lang, false,
                  data.eventsIds.length > 1 ? true : false,
                  `1/${data.eventsIds.length}`,
                  ctx.session.currentEvent.userId === ctx.session.user.id || ctx.session.user.admin,
                  ctx.session.user.admin && !ctx.session.currentEvent.published
               ),
            },
            parse_mode: 'Markdown'
         },
      );
      ctx.session.messageIdToEdit = msg.message_id
   }

   async updateEventsList(@Ctx() ctx: Context, direction: 'forward' | 'backward') {
      const lang = ctx.session.language;
      const { allEvents, current, totalCount } = ctx.session.eventNavigation;

      // Определяем текущий индекс
      const currentIndex = allEvents.findIndex(event => event === current);
      if (currentIndex === -1) {
         console.error('Ошибка: текущий eventId не найден в навигации');
         return;
      }

      // Определяем новый индекс в зависимости от направления
      let newIndex = currentIndex;
      if (direction === 'forward' && currentIndex < allEvents.length - 1) {
         newIndex++;
      } else if (direction === 'backward' && currentIndex > 0) {
         newIndex--;
      }
      // Получаем новое событие
      const newEventId = allEvents[newIndex];
      const newEvent = await this.eventsService.findById(newEventId);
      // Обновляем сессию
      ctx.session.eventNavigation.current = newEventId;
      ctx.session.currentEvent = {
         title: '',
         eventId: newEvent.id,
         userId: newEvent.userId,
         name: newEvent.name,
         photo: newEvent.photo,
         description: newEvent.description,
         fullDateText: newEvent.fullDateText,
         cost: newEvent.cost,
         phone: newEvent.phone,
         published: newEvent.published,
         decline: newEvent.decline,
         category: '',
         categoryId: newEvent.categoryId,
         selectedYear: newEvent.selectedYear,
         selectedMonth: newEvent.selectedMonth,
         fullDate: newEvent.fullDate,
      };
      // Генерируем текст события
      const eventText = await this.eventCreateScene.genEventText(ctx);
      // Обновляем сообщение
      try {
         await ctx.telegram.editMessageMedia(
            ctx.chat.id,
            ctx.session.messageIdToEdit,
            undefined,
            {
               type: 'photo',
               media: newEvent.photo || 'https://via.placeholder.com/300',
               caption: eventText,
               parse_mode: 'Markdown'
            },
            {
               reply_markup: {
                  inline_keyboard: this.eventsKeyboard.viewer(
                     lang,
                     newIndex > 0,
                     newIndex < allEvents.length - 1,
                     `${newIndex + 1}/${totalCount}`,
                     ctx.session.currentEvent.userId === ctx.session.user.id || ctx.session.user.admin,
                     ctx.session.user.admin && !ctx.session.currentEvent.published
                  ),
               },
            },
         );
      } catch (error) {
         console.error('Ошибка обновления события:', error);
      }
   }

   async showNoEventsKeyboard(@Ctx() ctx: Context, lang) {
      try {
         const msg = await ctx.reply(this.eventsKeyboard.title.allNoData[lang], {
            reply_markup: {
               inline_keyboard: this.eventsKeyboard.noEvents(lang),
            }}
         )
         ctx.session.messageIdToEdit = msg.message_id
      } catch (error) {
         ctx.reply('Ошибка вывода мероприятий. Попробуйте перезапустить бота /start')
      }
   }
   async showNoUserEventsKeyboard(@Ctx() ctx: Context, lang) {
      const msg = await ctx.reply(this.eventsKeyboard.title.usersNoData[lang], {
         reply_markup: {
            inline_keyboard: this.eventsKeyboard.noUsersEvents(lang),
         }}
      )
      ctx.session.messageIdToEdit = msg.message_id
   }

   @Action('forward')
   async nextEvent(@Ctx() ctx: Context) {
      await this.updateEventsList(ctx, 'forward');
   }
   @Action('backward')
   async prevEvent(@Ctx() ctx: Context) {
      await this.updateEventsList(ctx, 'backward');
   }

   @Action('add_event')
   async addEvent(@Ctx() ctx: Context) {
      ctx.session.query = ''
      ctx.session.prevScene = 'EVENTS_LIST_SCENE'
      await ctx.scene.enter('EVENT_CREATE_SCENE')
   }

   @Action('all_events')
   async showAllEvents(@Ctx() ctx: Context) {
      ctx.session.query = 'showAllEvents'
      await ctx.scene.enter('EVENTS_LIST_SCENE')
   }

   @Action('edit_event')
   async editEvent(@Ctx() ctx: Context) {
      ctx.session.query = 'editEvent'
      ctx.session.prevScene = 'EVENTS_LIST_SCENE'
      await ctx.scene.enter('EVENT_CREATE_SCENE')
   }

   @Action('delete_event')
   async deleteEvent(@Ctx() ctx: Context) {
      await this.eventsService.deleteEvent(ctx.session.currentEvent.eventId)
      await ctx.scene.enter('EVENTS_LIST_SCENE')
   }

   @Action('approve_event')
   async approveEvent(@Ctx() ctx: Context) {
      await this.eventsService.approveEvent(ctx.session.currentEvent.eventId)
      await ctx.scene.enter('EVENTS_LIST_SCENE')
   }

   @Action('decline_event')
   async declineEvent(@Ctx() ctx: Context) {
      await this.eventsService.declineEvent(ctx.session.currentEvent.eventId)
      const creator = await this.userService.findById(ctx.session.currentEvent.userId)
      await ctx.telegram.sendMessage(
         creator.tgId,
         `Ваше мероприятие ${ctx.session.currentEvent.name} было отклонено`
      )
      await ctx.scene.enter('EVENTS_LIST_SCENE')
   }

   @On('text')
   async handleTextInput(@Ctx() ctx: Context, @Message() message) {
      await this.botService.checkGlobalCommand(ctx, message.text, 'EVENTS_LIST_SCENE')
      ctx.session.messageToDelete.push(message.message_id);
   }

   @On('callback_query')
   async checkCallback(@Ctx() ctx: Context) {
      console.log('gggggg')
      await this.botService.checkGlobalActions(ctx, 'EVENTS_LIST_SCENE')
   }
}

