import { Injectable } from '@nestjs/common';
import { Ctx } from 'nestjs-telegraf';
import { Context } from './context.interface';

@Injectable()
export class BotService {
   async clearChat(ctx: Context) {
      if (ctx.session.messageToDelete.length > 0) {
         try {
            await ctx.telegram.deleteMessages(ctx.chat.id, ctx.session.messageToDelete);
         } catch (error) {
            console.error('Error deleting messages', error);
         } finally {
            ctx.session.messageToDelete = [];
         }
      }
   }
   async deleteDublicate(@Ctx() ctx: Context) {
      if(ctx.session.messageIdToEdit) {
         try {
            await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.messageIdToEdit);
         } catch (error) {
            console.log('Ошибка удаления сообщения')
            ctx.session.messageIdToEdit = null
         }
      }
      ctx.session.messageIdToEdit = null
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
            id: '', title:'', name: '', photo: '', description: '', date: '', cost: '', category: '', phone: '', status: '',
            selectedYear: null, selectedMonth: null, selectedTime: null, fullDate: '',
         }
      }
   }
}
