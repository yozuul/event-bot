import { Injectable } from '@nestjs/common';
import { Ctx } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { EventsKeyboard, EventsTextGenerator } from '../keyboards';
import { UsersService } from '@app/users/users.service';
import { BotService } from '../bot.service';
import { EventsService } from '@app/events/events.service';

@Injectable()
export class EventsListActions {
   constructor(
      private readonly botService: BotService,
      private readonly userService: UsersService,
      private readonly eventsService: EventsService,
      private readonly eventsTextGenerator: EventsTextGenerator,
      private readonly eventsKeyboard: EventsKeyboard,
   ) {}

   async addEvent(@Ctx() ctx: Context) {
      ctx.session.query = ''
      ctx.session.prevScene = 'EVENTS_LIST_SCENE'
      await ctx.scene.enter('EVENT_CREATE_SCENE')
   }

   async showAllEvents(@Ctx() ctx: Context) {
      ctx.session.query = 'showAllEvents'
      await ctx.scene.enter('EVENTS_LIST_SCENE')
   }

   async showCalendar(@Ctx() ctx: Context) {
      ctx.session.query = 'showCalendar'
      await ctx.scene.enter('EVENT_CREATE_SCENE')
   }

   async editEvent(@Ctx() ctx: Context) {
      ctx.session.query = 'editEvent'
      ctx.session.prevScene = 'EVENTS_LIST_SCENE'
      await ctx.scene.enter('EVENT_CREATE_SCENE')
   }

   async deleteEvent(@Ctx() ctx: Context) {
      await this.eventsService.deleteEvent(ctx.session.currentEvent.id)
      await ctx.scene.enter('EVENTS_LIST_SCENE')
   }

   async approveEvent(@Ctx() ctx: Context) {
      await this.eventsService.approveEvent(ctx.session.currentEvent.eventId)
      await ctx.scene.enter('EVENTS_LIST_SCENE')
   }

   async declineEvent(@Ctx() ctx: Context) {
      await this.eventsService.declineEvent(ctx.session.currentEvent.eventId)
      const creator = await this.userService.findById(ctx.session.currentEvent.userId)
      await ctx.telegram.sendMessage(
         creator.tgId,
         `Ваше мероприятие ${ctx.session.currentEvent.name} было отклонено`
      )
      await ctx.scene.enter('EVENTS_LIST_SCENE')
   }

   async eventOperation(@Ctx() ctx: Context) {
      const command = ctx.callbackQuery['data'].split('_')[0]
      const eventId = ctx.callbackQuery['data'].split('_')[2]
      console.log('command', command)
      console.log('eventId', eventId)
      if(command === 'delete') {
         await this.eventsService.deleteEvent(eventId)
         await ctx.deleteMessage()
         return
      }
      if(!ctx.session.checkboxes[eventId]) {
         ctx.session.checkboxes[eventId] = { public_to_group: true, public_to_bot: true }
      }
      const event = await this.botService.eventOperation(ctx)

      if(ctx.session.checkboxes[eventId].public_to_group) {
         ctx.session.currentEvent = event

         const eventId = ctx.session.currentEvent.id
         // console.log('eventId', eventId)
         const eventText = await this.eventsTextGenerator.genEventText(
            ctx, false, false, false, ctx.session.user.admin
         )
         const msg = await ctx.telegram.sendPhoto(process.env.PUBLIC_CHANNEL,
            ctx.session.currentEvent.photo || 'https://via.placeholder.com/300', {
               caption: eventText,
               parse_mode: 'Markdown'
            },
         )
         event.groupPostId = msg['message_id']
         try {
            await event.save()
         } catch (error) {
            console.log('Ошибка сохранения ID поста мероприятия')
         }
      }
   }

   async likesBtn(@Ctx() ctx: Context) {
      // delete ctx.session.likes
      const callback = ctx.callbackQuery['data']
      const actionType = callback.split('_')[0]
      const eventId = callback.split('_')[1]

      if (!ctx.session.likes) {
         ctx.session.likes = {}
         ctx.session.likes[eventId] = null
      }
      if(!ctx.session.likes[eventId]) {
         if(ctx.session.likes[eventId] !== 0) {
            ctx.session.likes[eventId] = null
         }
      }

      const userVote = ctx.session.likes[eventId]
      // Получаем событие из базы данных
      const event = await this.eventsService.findEventById(eventId)

      if (actionType === 'like') {
         if (ctx.session.likes[eventId] === null) {
            // Если пользователь ещё не голосовал
            ctx.session.likes[eventId] = 1
            event.likes += 1  // Увеличиваем количество лайков в базе
            await event.save()  // Сохраняем изменения в базе данных
            ctx.answerCbQuery(`Вы поставили лайк этому мероприятию`)
         }

         if (userVote === 1) {
            ctx.answerCbQuery(`Вы уже поставили лайк этому мероприятию`)
         }

         if (userVote === 0) {
            // Если пользователь сменил дизлайк на лайк
            ctx.answerCbQuery(`Вы сменили дизлайк на лайк`)
            ctx.session.likes[eventId] = 1
            event.likes += 1   // Увеличиваем лайки
            event.dislikes -= 1 // Уменьшаем дизлайки
            await event.save()  // Сохраняем изменения в базе данных
         }
      }

      if (actionType === 'dislike') {
         if (ctx.session.likes[eventId] === null) {
            // Если пользователь ещё не голосовал
            ctx.session.likes[eventId] = 0
            event.dislikes += 1  // Увеличиваем количество дизлайков в базе
            await event.save()   // Сохраняем изменения в базе данных
            ctx.answerCbQuery(`Вы поставили дизлайк этому мероприятию`)
         }

         if (userVote === 0) {
            ctx.answerCbQuery(`Вы уже поставили дизлайк этому мероприятию`)
         }

         if (userVote === 1) {
            // Если пользователь сменил лайк на дизлайк
            ctx.answerCbQuery(`Вы сменили лайк на дизлайк`)
            ctx.session.likes[eventId] = 0
            event.likes -= 1    // Уменьшаем лайки
            event.dislikes += 1 // Увеличиваем дизлайки
            await event.save()  // Сохраняем изменения в базе данных
         }
      }

      let canEdit = false
      if(ctx.session.currentEvent.userId === ctx.session.user.id) {
         if(!ctx.session.currentEvent.published) {
            canEdit = true
         }
      }
      if(ctx.session.user.admin) {
         canEdit = true
      }
      // Обновление сообщения с актуальными данными
      try {
         const navi = ctx.session.eventNavigation

         let keyboard = null
         if(ctx.session.eventNavigation.firstSlide) {
            keyboard = this.eventsKeyboard.viewer(
               ctx.session.language,
               false,
               navi.allEvents.length > 1 ? true : false,
               `1/${navi.allEvents.length}`,
               canEdit,
               ctx.session,
               ctx.session.query === 'showModerateEvents',
               event
            )
         } else {
            keyboard = this.eventsKeyboard.viewer(
               ctx.session.language,
               navi.newIndex,
               navi.newIndex < navi.allEvents.length - 1,
               `${navi.newIndex + 1}/${navi.totalCount}`,
               canEdit,
               ctx.session,
               ctx.session.query === 'showModerateEvents',
               event
            )
         }
         await ctx.telegram.editMessageReplyMarkup(
            ctx.chat.id,
            ctx.session.messageIdToEdit,
            undefined,
            {
               inline_keyboard: keyboard,
            }
         );
      } catch (error) {
         console.error('Ошибка обновления клавиатуры:', error);
      }
   }
}

