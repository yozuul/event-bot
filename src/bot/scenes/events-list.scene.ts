import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action, Command, On, Message, Start } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { EventsKeyboard, EventsTextGenerator } from '../keyboards';
import { UsersService } from '@app/users/users.service';
import { BotService } from '../bot.service';
import { EventsService } from '@app/events/events.service';
import { EventsListActions } from '../actions';

@Scene('EVENTS_LIST_SCENE')
@Injectable()
export class EventsScene {
   constructor(
      private readonly botService: BotService,
      private readonly userService: UsersService,
      private readonly eventsService: EventsService,
      private readonly eventsKeyboard: EventsKeyboard,
      @Inject(forwardRef(() => EventsListActions))
      private readonly evetsListActions: EventsListActions,
      private readonly eventsTextGenerator: EventsTextGenerator
   ) {}

   @SceneEnter()
   async onSceneEnter(@Ctx() ctx: Context) {
      await this.botService.sceneEnterCleaner(ctx)
      ctx.session.eventNavigation = {
         allEvents: [], current: '', totalCount: 0,
      };
      await this.checkEvents(ctx)
   }

   async checkEvents(@Ctx() ctx: Context) {
      const lang = ctx.session.language
      try {
         const user = await this.userService.findByTgId(ctx.from.id)
         ctx.session.user.admin = user.admin
         ctx.session.user.name = user.name
      } catch (error) {
         console.log('events-list.scene.ts checkEvents - ОШИБКА ПОЛЬЗОВАТЕЛЯ')
      }
      let isNewPosts = false
      if(ctx.session.eventNavigation.allEvents.length > 0) {
         isNewPosts = true
      }

      if(ctx.session.query === 'showEventsForDate') {
         const data = await this.eventsService.findAllEventsIds(
            true, false, ctx.session.showEventsForDate, ctx.session.user.admin
         )
         if(!data.firstEvent) {
            await this.showNoEventsKeyboard(ctx, lang)
         }
         if(ctx.session.eventNavigation.allEvents.length === data.eventsIds.length) {
            return
         }
         if(data.firstEvent) {
            this.initSlidersData(ctx, data)
            if(!isNewPosts) {
               await this.showEventsList(ctx, data)
            }
         }
      }

      if(ctx.session.query === 'showCategory') {
         console.log('showCategory')
         const data = await this.eventsService.findAllEventsIds(
            true, ctx.session.showCategory, false, ctx.session.user.admin
         )
         if(!data.firstEvent) {
            await this.showNoEventsKeyboard(ctx, lang)
         }
         if(ctx.session.eventNavigation.allEvents.length === data.eventsIds.length) {
            return
         }
         if(data.firstEvent) {
            this.initSlidersData(ctx, data)
            if(!isNewPosts) {
               await this.showEventsList(ctx, data)
            }
         }
      }

      if(ctx.session.query === 'showModerateEvents') {
         console.log('showModerateEvents')
         const data = await this.eventsService.findAllEventsIds(false)
         if(!data.firstEvent) {
            const msg = await ctx.reply('Мероприятия на модерации не найдены')
            ctx.session.messageToDelete.push(msg.message_id)
         }
         if(ctx.session.eventNavigation.allEvents.length === data.eventsIds.length) {
            return
         }
         if(data.firstEvent) {
            this.initSlidersData(ctx, data)
            if(!isNewPosts) {
               await this.showEventsList(ctx, data)
            }
         }
      }

      if(!ctx.session.query || ctx.session.query === 'showAllEvents') {
         console.log('showAllEvents')
         const data = await this.eventsService.findAllEventsIds(
            true, false, false, ctx.session.user.admin
         )
         // console.log('showAllEvents', data)
         if(!data.firstEvent) {
            await this.showNoEventsKeyboard(ctx, lang)
         }
         if(ctx.session.eventNavigation.allEvents.length === data.eventsIds.length) {
            return
         }
         if(data.firstEvent) {
            this.initSlidersData(ctx, data)
            if(!isNewPosts) {
               await this.showEventsList(ctx, data)
            }
         }
      }

      if(ctx.session.query === 'showAllUsersEvents') {
         console.log('showAllUsersEvents')
         const data = await this.eventsService.findAllUsersEvents(ctx.from.id)
         // console.log('showAllUsersEvents', data)
         if(!data.firstEvent) {
            await this.showNoUserEventsKeyboard(ctx, lang)
         }
         if(ctx.session.eventNavigation.allEvents.length === data.eventsIds.length) {
            return
         }
         if(data.firstEvent) {
            this.initSlidersData(ctx, data)
            if(!isNewPosts) {
               await this.showEventsList(ctx, data)
            }
         }
      }
   }

   initSlidersData(ctx, data) {
      ctx.session.eventNavigation.allEvents = data.eventsIds
      ctx.session.eventNavigation.current = data.firstEvent.id
      ctx.session.eventNavigation.totalCount = data.eventsIds.length
      ctx.session.currentEvent = data.firstEvent
      ctx.session.currentEvent.eventId = data.firstEvent.id
      ctx.session.currentEvent.title = ''
   }

   async showEventsList(@Ctx() ctx: Context, data) {
      let eventText = await this.eventsTextGenerator.genEventText(
         ctx, false, false, false, ctx.session.user.admin
      )
      let canEdit = false
      if(ctx.session.currentEvent.userId === ctx.session.user.id) {
         if(!ctx.session.currentEvent.published) {
            canEdit = true
         }
      }
      if(ctx.session.user.admin) {
         canEdit = true
      }
      ctx.session.eventNavigation.firstSlide = true
      const msg = await ctx.replyWithPhoto(
         ctx.session.currentEvent.photo || 'https://via.placeholder.com/300',
         {
            caption: eventText,
            reply_markup: {
               inline_keyboard: this.eventsKeyboard.viewer(
                  ctx.session.language,
                  false,
                  data.eventsIds.length > 1 ? true : false,
                  `1/${data.eventsIds.length}`,
                  canEdit,
                  ctx.session,
                  ctx.session.query === 'showModerateEvents',
                  ctx.session.currentEvent
               ),
            },
            parse_mode: 'Markdown'
         },
      );
      ctx.session.messageIdToEdit = msg.message_id
   }

   async updateEventsList(@Ctx() ctx: Context, direction: 'forward' | 'backward') {
      await this.checkEvents(ctx)
      const user = await this.userService.findByTgId(ctx.from.id)
      ctx.session.user.admin = user.admin
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
      ctx.session.currentEvent = newEvent
      ctx.session.currentEvent.eventId = newEvent.id
      // console.log('currentEvent', ctx.session.currentEvent)
      // Генерируем текст события
      const eventText = await this.eventsTextGenerator.genEventText(
         ctx, false, false, false, ctx.session.user.admin
      )
      let canEdit = false
      if(ctx.session.currentEvent.userId === ctx.session.user.id) {
         if(!ctx.session.currentEvent.published) {
            canEdit = true
         }
      }
      if(ctx.session.user.admin) {
         canEdit = true
      }
      ctx.session.eventNavigation.newIndex = newIndex
      ctx.session.eventNavigation.firstSlide = false
      try {
         await ctx.telegram.editMessageMedia(
            ctx.chat.id, ctx.session.messageIdToEdit, undefined,
            {
               type: 'photo',
               media: newEvent.photo || 'https://via.placeholder.com/300',
               caption: eventText,
               parse_mode: 'Markdown'
            },
            {
               reply_markup: {
                  inline_keyboard: this.eventsKeyboard.viewer(
                     lang, // lang
                     newIndex > 0, // prev
                     newIndex < allEvents.length - 1, // next
                     `${newIndex + 1}/${totalCount}`, // count
                     canEdit, // canEdit
                     ctx.session, // session
                     ctx.session.query === 'showModerateEvents',
                     newEvent
                  ),
               },
            },
         );
      } catch (error) {
         console.error('Ошибка обновления события:', error);
      }
   }

   async showNoEventsKeyboard(@Ctx() ctx: Context, lang) {
      let showAnotherDateBtn = false
      if(ctx.session.showEventsForDate) {
         showAnotherDateBtn = true
      }
      try {
         const msg = await ctx.reply(this.eventsKeyboard.title.allNoData[lang], {
            reply_markup: {
               inline_keyboard: this.eventsKeyboard.noEvents(lang, showAnotherDateBtn),
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
      await this.evetsListActions.addEvent(ctx)
   }

   @Action('all_events')
   async showAllEvents(@Ctx() ctx: Context) {
      await this.evetsListActions.showAllEvents(ctx)
   }

   @Action('show_calendar')
   async showCalendar(@Ctx() ctx: Context) {
      await this.evetsListActions.showCalendar(ctx)
   }

   @Action('edit_event')
   async editEvent(@Ctx() ctx: Context) {
      await this.evetsListActions.editEvent(ctx)
   }

   @Action('delete_event')
   async deleteEvent(@Ctx() ctx: Context) {
      await this.evetsListActions.deleteEvent(ctx)
   }

   @Action('approve_event')
   async approveEvent(@Ctx() ctx: Context) {
      await this.evetsListActions.approveEvent(ctx)
   }

   @Action('decline_event')
   async declineEvent(@Ctx() ctx: Context) {
      await this.evetsListActions.declineEvent(ctx)
   }

   @Action(/approve_event_(.+)/)
   @Action(/decline_event_(.+)/)
   @Action(/delete_event_(.+)/)
   async eventOperation(@Ctx() ctx: Context) {
      await this.evetsListActions.eventOperation(ctx)
   }

   @Action(/like_(.+)/)
   @Action(/dislike_(.+)/)
   async likesBtn(@Ctx() ctx: Context) {
      await this.evetsListActions.likesBtn(ctx)
   }

   @On('text')
   async handleTextInput(@Ctx() ctx: Context, @Message() message) {
      await this.botService.checkGlobalCommand(ctx, message.text, 'EVENTS_LIST_SCENE')
      ctx.session.messageToDelete.push(message.message_id);
   }

   @On('callback_query')
   async checkCallback(@Ctx() ctx: Context) {
      await this.botService.checkGlobalActions(ctx, 'EVENTS_LIST_SCENE')
   }
}

