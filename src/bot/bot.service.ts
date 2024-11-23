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
      if(!ctx.session.user) {
         await this.resetSession(ctx)
         ctx.session.user = await this.userService.findByTgId(ctx.from.id)
         ctx.session.language = ctx.session.user.language
      }
      ctx.session.awaitingInput = null
      if(ctx.session.messageIdToEdit) {
         try {
            await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.messageIdToEdit);
         } catch (error) {
            console.log('Ошибка удаления сообщения deleteDublicate bot.service')
         } finally {
            ctx.session.messageIdToEdit = null
         }
      }
   }

   async checkGlobalCommand(@Ctx() ctx: Context, text: string, currentScene) {
      if(!ctx.session.user) {
         await this.resetSession(ctx)
         ctx.session.user = await this.userService.findByTgId(ctx.from.id)
         ctx.session.language = ctx.session.user.language
      }
      if(text === '/start') {
         const targetSceneName = 'LANGUAGE_SCENE'
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
         targetSceneName !== currentScene ? ctx.session.prevScene = currentScene : ''
         await ctx.scene.enter('EVENT_CREATE_SCENE')
      }
      await ctx.deleteMessage()
   }

   async checkGlobalActions(@Ctx() ctx: Context, query: string, currentScene) {
      let founded = false
      if(query === 'go_back') {
         const targetSceneName = ctx.session.prevScene
         ctx.session.prevScene = currentScene
         if(currentScene === 'EVENTS_LIST_SCENE') {
            ctx.session.query === ''
         }
         founded = true
         await ctx.scene.enter(targetSceneName)
      }
      return founded
   }

   async resetSession(@Ctx() ctx: Context) {
      ctx.session = {
         scene: '',
         profileStep: '',
         language: 'ru',
         awaitingInput: null,
         user: {
            id: '', name: '', tgId: 0, phone: '', age: 0, avatar: '', language: 'ru',
         },
         messageIdToEdit: null,
         messageToDelete: [],
         calendarMessageId: null,
         query: '',
         prevScene: '',
         currentEvent: {
            eventId: '', title:'', name: '', photo: '', description: '', date: '', cost: '', category: '', phone: '', status: '',
            selectedYear: null, selectedMonth: null, selectedTime: null, fullDate: '', fullDateText: ''
         }
      }
   }
}
