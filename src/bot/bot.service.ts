import { Injectable } from '@nestjs/common';
import { Ctx } from 'nestjs-telegraf';

import { Context } from './context.interface';
import { UsersService } from '@app/users/users.service';
import { EventsKeyboard } from './keyboards';
import { EventsService} from '@app/events/events.service';

@Injectable()
export class BotService {
   constructor(
      private readonly userService: UsersService,
      private readonly eventsService: EventsService,
      private readonly eventsKeyboard: EventsKeyboard,
   ) {}

   async clearChat(@Ctx() ctx: Context) {
      if (ctx.session.messageToDelete.length > 0) {
         try {
            await ctx.telegram.deleteMessages(ctx.chat.id, ctx.session.messageToDelete);
         } catch (error) {
            await this.clearChatByOne(ctx)
         } finally {
            ctx.session.messageToDelete = [];
         }
      }
   }
   async clearChatByOne(@Ctx() ctx: Context) {
      for (const messageId of ctx.session.messageToDelete) {
         try {
            await ctx.telegram.deleteMessage(ctx.chat.id, messageId);
         } catch (error) {
            console.log('Сообщение уже удалено')
         }
      }
   }

   async sceneEnterCleaner(@Ctx() ctx: Context) {
      const currentUser = await this.userService.findByTgId(ctx.from.id)
      if(!currentUser) {
         await ctx.scene.enter('SETTINGS_SCENE')
         return
      }
      ctx.session.awaitingInput = null
      if(!ctx.session.user || !ctx.session.user?.id) {
         await this.resetSession(ctx)
         await ctx.scene.enter('SETTINGS_SCENE')
         return
      }
      if(ctx.session.user?.id !== currentUser.id) {
         ctx.session.user = currentUser
      }
      if(ctx.session.messageIdToEdit) {
         try {
            await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.messageIdToEdit);
         } catch (error) {
            console.log('Ошибка удаления сообщения sceneEnterCleaner в bot.service')
         }
      }
      await this.clearChat(ctx)
   }

   async checkGlobalCommand(@Ctx() ctx: Context, text: string, currentScene) {
      if(ctx.message.chat.type === 'supergroup') {
         return
      }
      if(!ctx.session.user || !ctx.session.user.id) {
         await this.resetSession(ctx)
         await ctx.scene.enter('SETTINGS_SCENE')
         return
      }
      if(!ctx.session.user.phone) {
         try {
            await ctx.deleteMessage()
         } catch (error) {
            console.log('Ошибка удаления сообщения checkGlobalCommand')
         }
         await ctx.scene.enter('SETTINGS_SCENE')
         return
      }
      if(text === '/start') {
         // const text = {
         //    uz: 'Samarqanddagi barcha tadbirlar haqidagi botga xush kelibsiz 📢',
         //    ru: 'Добро пожаловать в бот о всех мероприятиях Самарканда 📢',
         // }
         const targetSceneName = 'SETTINGS_SCENE'
         await ctx.scene.enter(targetSceneName)
         return
      }
      if(text === '/profile') {
         const targetSceneName = 'PROFILE_SCENE'
         targetSceneName !== currentScene ? ctx.session.prevScene = currentScene : ''
         await ctx.scene.enter(targetSceneName)
      }
      if(text === '/events') {
         const targetSceneName = 'EVENTS_LIST_SCENE'
         targetSceneName !== currentScene ? ctx.session.prevScene = currentScene : ''
         ctx.session.query = 'showAllEvents'
         await ctx.scene.enter(targetSceneName)
      }
      if(text === '/my_events') {
         const targetSceneName = 'EVENTS_LIST_SCENE'
         targetSceneName !== currentScene ? ctx.session.prevScene = currentScene : ''
         ctx.session.query = 'showAllUsersEvents'
         await ctx.scene.enter(targetSceneName)
      }
      if(text === '/add_event') {
         const targetSceneName = 'EVENT_CREATE_SCENE'
         ctx.session.query === 'addEvent'
         targetSceneName !== currentScene ? ctx.session.prevScene = currentScene : ''
         await ctx.scene.enter(targetSceneName)
      }
      if(text === '/welcome') {
         const targetSceneName = 'WELCOME_SCENE'
         ctx.session.query === ''
         targetSceneName !== currentScene ? ctx.session.prevScene = currentScene : ''
         await ctx.scene.enter(targetSceneName)
      }
      try {
         await ctx.deleteMessage()
      } catch (error) {
         console.log('Ошибка удаления сообщения глобальной команды')
      }
   }

   async checkGlobalActions(@Ctx() ctx: Context, currentScene) {
      console.log('checkGlobalActions')
      let query = null
      let clean = true
      if(ctx.callbackQuery && 'data' in ctx.callbackQuery) {
         query = ctx.callbackQuery.data
      }
      if(query === 'go_back') {
         console.log('go_back')
         const targetSceneName = ctx.session.prevScene
         ctx.session.prevScene = currentScene
         if(currentScene === 'EVENTS_LIST_SCENE' || currentScene === 'EVENT_CREATE_SCENE') {
            ctx.session.query = ''
         }
         clean = false
         await ctx.scene.enter(targetSceneName)
      }
      if(query === 'empty' || query === 'noop') {
         clean = false
         await ctx.answerCbQuery();
      }
      if(query === 'approve_event') {
         clean = false
         await ctx.answerCbQuery('Публикация одобрена');
      }
      if(clean) {
         console.log('clean')
         try {
            await ctx.deleteMessage()
            await ctx.answerCbQuery('Сообщение устарело');
            console.log('Удаление сообщения из EVENTS_LIST_SCENE')
         } catch (error) {
            console.log('Ошибка')
         }
      }
   }

   async publicToFlag(@Ctx() ctx: Context, viewer?) {
      let command
      let eventId
      if('data' in ctx.callbackQuery) {
         command = ctx.callbackQuery.data.split('_')[0]
         eventId = ctx.callbackQuery.data.split('_')[1]
         this.checkCheckboxex(ctx, eventId)
         if(command == 'publicToBot') {
            ctx.session.checkboxes[eventId].public_to_bot = !ctx.session.checkboxes[eventId].public_to_bot;
         }
         if(command == 'publicToGroup') {
            ctx.session.checkboxes[eventId].public_to_group = !ctx.session.checkboxes[eventId].public_to_group;
         }
      }

      let updatedKeyboard
      if(!viewer) {
         updatedKeyboard = this.eventsKeyboard.addEditEvent(
            ctx.session.language, 'canSave', 'canEdit', 'canDelete', 'isAdmin', eventId, ctx.session
         );
      } else {
         updatedKeyboard = this.eventsKeyboard.viewer(
            ctx.session.language, false,
            ctx.session.eventNavigation.allEvents.length > 1 ? true : false,
            `1/${ctx.session.eventNavigation.totalCount}`,
            'canEdit',
            ctx.session,
            ctx.session.query === 'showModerateEvents',
         )
      }
      await ctx.telegram.editMessageReplyMarkup(ctx.chat.id, ctx.callbackQuery.message.message_id, null, {
         inline_keyboard: updatedKeyboard,
      });
      await ctx.answerCbQuery();
   }

   async eventOperation(@Ctx() ctx: Context) {
      let command
      let eventId
      let messageToUser
      if('data' in ctx.callbackQuery) {
         command = ctx.callbackQuery.data.split('_')[0]
         eventId = ctx.callbackQuery.data.split('_')[2]
      }
      const event = await this.eventsService.findByIdAndSave(eventId)
      const userId = event?.userId
      event.published = true
      await event.save()
      if(command === 'approve') {
         messageToUser = '✅ Ваше мероприятие одобрено и размещено'
      }
      if(command === 'decline') {
         messageToUser = '⛔️ Ваше мероприятие было отклонено'
      }
      try {
         const user = await this.userService.findById(userId)
         await ctx.telegram.sendMessage(user.tgId, messageToUser)
      } catch (error) {
         console.log('Ошибка отправки уведомления пользователю')
      }
      await ctx.answerCbQuery();
      return event
   }

   checkCheckboxex(@Ctx() ctx: Context, eventId) {
      if(!ctx.session.checkboxes) {
         ctx.session.checkboxes = {}
      }
      if(!ctx.session.checkboxes[eventId]) {
         ctx.session.checkboxes[eventId] = { public_to_group: true, public_to_bot: true }
      }
   }

   async resetSession(@Ctx() ctx: Context, started?) {
      const user = await this.userService.findByTgId(ctx.from.id)
      ctx.session = {
         likes: {},
         scene: '',
         profileStep: '',
         language: user.language,
         awaitingInput: null,
         user: user,
         messageIdToEdit: null,
         messageToDelete: [],
         calendarMessageId: null,
         query: '',
         prevScene: '',
         showCategory: '',
         showEventsForDate: null,
         currentEvent: {
            eventId: '', title:'', name: '', photo: '', description: '', date: '', cost: '',
            category: '', categoryId: '', published: false, decline: false, phone: '', status: '',
            selectedYear: null, selectedMonth: null, selectedTime: null, fullDate: '', fullDateText: '',
            dateRawBegin: null, dateRawEnd: null, msgRawEndId: null
         },
         eventNavigation: {
            allEvents: [],
            current: '',
            totalCount: ''
         },
         editCategory: { uz: '', ru: '', id: null },
         checkboxes:  {
            public_to_group: true, public_to_bot: true,
         }
      }
      if(!ctx.session.user.name) {
         if(ctx.from.first_name) {
            ctx.session.user.name = ctx.from.first_name
            user.name = ctx.from.first_name
            try {
               await user.save()
            } catch (error) {
               console.log('Ошибка сохранения имени пользователя')
            }
         }
      }
      if(!started) {
         try {
            await ctx.deleteMessage()
         } catch (error) {
            console.log('Ошибка удаления resetSession')
         }
      }
   }
}
