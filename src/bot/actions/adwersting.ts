import { Injectable } from '@nestjs/common';
import { Ctx, InjectBot } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { AdwerstingService } from '@app/adwersting/adwersting.service';
import { UsersService } from '@app/users/users.service';

@Injectable()
export class AdwerstingActions {
   constructor(
      @InjectBot()
      private bot,
      private readonly adwerstingService: AdwerstingService,
      private readonly userService: UsersService
   ) {}

   async addAdwControlButton(@Ctx() ctx: Context, postId) {
      await ctx.telegram.sendMessage(
         process.env.ADW_CHANNEL, `⬆️ Готово к отправке: ID: ${postId}`,
         this.controlButtons(postId)
      );
   }

   async forwardMessageToUsers(@Ctx() ctx: Context) {
      // const userIds = [1884297416, 6066527002]
      const chatId = parseInt(process.env.ADW_CHANNEL)
      const adwPostId = this.adwPostId(ctx)
      const users = await this.userService.findAll()
      await ctx.answerCbQuery(`Рассылка запущена, всего получателей: ${users.length}`)

      for (const user of users) {
         try {
            const msg = await ctx.telegram.forwardMessage(user.tgId, chatId, adwPostId);
            await this.adwerstingService.addSenderChatId(adwPostId, msg.message_id, user.tgId)
         } catch (error) {
            console.error(`Ошибка при пересылке сообщения пользователю ${user.tgId}:`, error);
         }
      }

      const buttonMessageId = ctx.callbackQuery.message.message_id
      const senders = await this.adwerstingService.findSenderChatIdByPostId(adwPostId)
      const newText = `⬆️ Рассылка заверешена. Доставлено сообщений: ${senders.length}`
      await this.editControlButtons(ctx, chatId, adwPostId, buttonMessageId, newText)
   }

   async editControlButtons(@Ctx() ctx: Context, chatId, adwPostId, buttonMessageId, newText) {
      try {
         await ctx.telegram.editMessageText(
            chatId, buttonMessageId,  undefined, newText,
            this.controlButtons(adwPostId)
         );
      } catch (error) {
         const errText = 'Ошибка при обновлении кнопок управления'
         console.log(error)
         await ctx.answerCbQuery(errText)
      }
   }

   async deleteAdwPost(@Ctx() ctx: Context) {
      const adwPostId = this.adwPostId(ctx)
      const msgs = await this.adwerstingService.findSenderChatIdByPostId(adwPostId)
      for (let msg of msgs) {
         try {
            await ctx.telegram.deleteMessage(msg.userId, msg.senderPostId)
         } catch (error) {
            console.log('Ошибка удаления сообщения')
         }
         try {
            await this.adwerstingService.cleaner(msg.senderPostId)
         } catch (error) {
            console.log('Ошибка удаления записи')
         }
      }
      await ctx.answerCbQuery('Очистка чатов завершена')
      const buttonMessageId = ctx.callbackQuery.message.message_id
      const newText = `⬆️ Чаты очищены`
      const chatId = parseInt(process.env.ADW_CHANNEL)
      await this.editControlButtons(ctx, chatId, adwPostId, buttonMessageId, newText)
   }

   adwPostId(ctx) {
      return ctx.callbackQuery['data'].split('_')[1]
   }

   controlButtons(postId) {
      return {
         reply_markup: {
            inline_keyboard: [
               [{
                  text: '✉️ Разослать',
                  callback_data: `sendAdwPost_${postId}`,
               },
               {
                  text: '🗑 Удалить',
                  callback_data: `deleteAdwPost_${postId}`,
               }],
            ],
         },
      }
   }

}