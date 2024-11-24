import { Injectable } from '@nestjs/common';
import { Command, Ctx, Hears, InjectBot, Message, On, Start, Update, Action } from 'nestjs-telegraf';
import { Telegraf, Markup } from 'telegraf';

import { Context } from './context.interface';
import { BotService } from './bot.service';

@Injectable()
@Update()
export class BotUpdate {
   constructor(
      @InjectBot()
         private readonly bot: Telegraf<Context>,
         private readonly botService: BotService,
   ) {}

   @Start()
   async startCommand(ctx: Context) {
      // Устанавливаем команды для кнопки "Меню"
      // await this.bot.telegram.deleteMyCommands();
      // await this.bot.telegram.setMyCommands([
      //    { command: 'events', description: 'Voqealar / Мероприятия' },
      //    { command: 'add_event', description: `Tadbir qo'shing / Добавить мероприятие` },
      //    { command: 'profile', description: 'Mening profilim / Мой профиль' },
      //    { command: 'start', description: 'Botni qayta ишга туширинг / Перезапустить бота' },
      // ],
      // { scope: { type: 'all_private_chats' } } );
      try {
         await ctx.deleteMessage()
      } catch (error) {
         console.log('Ошибка удаления стартового сообщения')
      }
      await ctx.scene.enter('SETTINGS_SCENE')
   }


   @On('text')
   async handleTextInput(@Ctx() ctx: Context, @Message() message) {
      await this.botService.checkGlobalCommand(ctx, message.text, 'EVENTS_LIST_SCENE')
      ctx.session.messageToDelete.push(message.message_id);
   }

   @On('callback_query')
   async checkCallback(@Ctx() ctx: Context) {
      await this.botService.checkGlobalActions(ctx, 'WELCOME_SCENE')
   }
}
