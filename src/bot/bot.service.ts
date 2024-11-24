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
      if(!ctx.session.user || !ctx.session.user.id) {
         await this.resetSession(ctx)
         await ctx.scene.enter('SETTINGS_SCENE')
         return
      }
      ctx.session.awaitingInput = null
      if(ctx.session.messageIdToEdit) {
         try {
            await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.messageIdToEdit);
         } catch (error) {
            console.log('Ошибка удаления сообщения sceneEnterCleaner в bot.service')
         } finally {
            ctx.session.messageIdToEdit = null
         }
      }
      await this.clearChat(ctx)
   }

   async checkGlobalCommand(@Ctx() ctx: Context, text: string, currentScene) {
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
      if(text === '/add_event') {
         const targetSceneName = 'EVENT_CREATE_SCENE'
         ctx.session.query === 'addEvent'
         targetSceneName !== currentScene ? ctx.session.prevScene = currentScene : ''
         await ctx.scene.enter('EVENT_CREATE_SCENE')
      }
      await ctx.deleteMessage()
   }

   async checkGlobalActions(@Ctx() ctx: Context, currentScene) {
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
      if(query === 'empty') {
         clean = false
         await ctx.answerCbQuery();
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
         currentEvent: {
            eventId: '', title:'', name: '', photo: '', description: '', date: '', cost: '',
            category: '', categoryId: '', published: false, phone: '', status: '',
            selectedYear: null, selectedMonth: null, selectedTime: null, fullDate: '', fullDateText: ''
         },
         eventNavigation: {
            allEvents: [],
            current: '',
            totalCount: ''
         },
         editCategory: { uz: '', ru: '', id: null }
      }
      try {
         await ctx.deleteMessage()
      } catch (error) {
         console.log('Ошибка удаления resetSession')
      }
   }
}
