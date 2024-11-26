import { Injectable } from '@nestjs/common';
import { Ctx, Message } from 'nestjs-telegraf';
import { Context } from './context.interface';
import { UsersService } from '@app/users/users.service';

@Injectable()
export class BotService {
   constructor(
      private userService: UsersService
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
      ctx.session.awaitingInput = null
      const currentUser = await this.userService.findByTgId(ctx.from.id)
      if(ctx.session.user.id !== currentUser.id) {
         ctx.session.user = currentUser
      }
      if(!ctx.session.user || !ctx.session.user.id) {
         await this.resetSession(ctx)
         await ctx.scene.enter('SETTINGS_SCENE')
         return
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
         console.log(ctx.message)
         return
      }
      if(!ctx.session.user || !ctx.session.user.id) {
         await this.resetSession(ctx)
         await ctx.scene.enter('SETTINGS_SCENE')
         return
      }
      if(text === '/start') {
         const targetSceneName = 'SETTINGS_SCENE'
         targetSceneName !== currentScene ? ctx.session.prevScene = currentScene : ''
         await ctx.scene.enter(targetSceneName)
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
      console.log(ctx.session)
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
      if(query === 'public_to_group' || query === 'public_to_bot') {
         clean = false
         if(!ctx.session.checkboxes) {
            ctx.session.checkboxes = {
               public_to_group: true, public_to_bot: true
            }
         }
      //    if(query = 'public_to_group') {
      //       ctx.session.checkboxex.public_to_group = !ctx.session.checkboxex.public_to_group
      //    }
      //    if(query = 'public_to_bot') {
      //       ctx.session.checkboxex.public_to_bot = !ctx.session.checkboxex.public_to_bot
      //    }
      //    await ctx.answerCbQuery('Публикация одобрена');
      //    const t = (lng, uz, ru) => (lng === 'uz' ? uz : ru);
      //    const generateCheckboxKeyboard = (lang, session) => [
      //       {
      //          text: `${ctx.session.checkboxex[query] ? '✅' : '⬜️'} ${t(lang, 'Гуруҳга', 'В группу')}`,
      //          callback_data: 'toggle_public_to_group',
      //       },
      //       {
      //          text: `${ctx.session.checkboxex[query] ? '✅' : '⬜️'} ${t(lang, 'Бот ичида', 'Внутри бота')}`,
      //          callback_data: 'toggle_public_to_bot',
      //       },
      //    ];
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

   async resetSession(@Ctx() ctx: Context) {
      const user = await this.userService.findByTgId(ctx.from.id)
      ctx.session = {
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
         currentEvent: {
            eventId: '', title:'', name: '', photo: '', description: '', date: '', cost: '',
            category: '', categoryId: '', published: false, decline: false, phone: '', status: '',
            selectedYear: null, selectedMonth: null, selectedTime: null, fullDate: '', fullDateText: '',
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
      try {
         await ctx.deleteMessage()
      } catch (error) {
         console.log('Ошибка удаления resetSession')
      }
   }
}
