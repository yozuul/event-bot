import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, On, Message } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { UsersService } from 'src/users/users.service';
import { BotService } from '../bot.service';

@Scene('WELCOME_SCENE')
@Injectable()
export class WelcomeScene {
   constructor(
      private readonly botService: BotService,
      private readonly usersService: UsersService
   ) {}

   @SceneEnter()
   async onSceneEnter(@Ctx() ctx: Context) {
      await this.botService.sceneEnterCleaner(ctx)
      const userLanguage = ctx.session.language
      const messages = {
         uz: 'Хуш келибсиз!\nУшбу бота Тошкентдаги тадбирлар ҳақидаги маълумотлар нашр этилади. \nБошлаш учун чапдаги менюни ишлатинг.',
         ru: 'Добро пожаловать!\nВ этом боте публикуется информация о мероприятиях в Ташкенте. \nИспользуйте меню слева, чтобы начать.',
      };
      const msg = await ctx.reply(messages[userLanguage] || messages['ru']);
      ctx.session.messageIdToEdit = msg.message_id
   }


   @On('text')
   async handleTextInput(@Ctx() ctx: Context, @Message() message) {
      await this.botService.checkGlobalCommand(ctx, message.text, 'EVENTS_LIST_SCENE')
      ctx.session.messageToDelete.push(message.message_id);
      const lng = ctx.session.language
   }

   @On('callback_query')
   async checkCallback(@Ctx() ctx: Context) {
      await this.botService.checkGlobalActions(ctx, 'WELCOME_SCENE')
   }
}