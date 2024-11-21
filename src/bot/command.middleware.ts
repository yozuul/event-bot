import { Injectable } from '@nestjs/common';
import { MiddlewareFn } from 'telegraf';
import { Scenes } from 'telegraf';
import { BotContext } from './context.interface';

@Injectable()
export class CommandMiddleware {
   private stage: Scenes.Stage<BotContext>;

   constructor() {
      // Убедитесь, что сцены зарегистрированы
      this.stage = new Scenes.Stage<BotContext>([
         /* Добавьте ваши сцены, например: */
         // new LanguageScene(), new ProfileScene(), new WelcomeScene(),
      ]);
   }

   use: MiddlewareFn<BotContext> = async (ctx, next) => {
      const message = ctx.message as { text: string };
      if (ctx.updateType === 'message' && message?.text?.startsWith('/')) {
         const command = message.text.split(' ')[0].substring(1);
         switch (command) {
            case 'help':
               await ctx.reply('Доступные команды: /start, /profile, /help');
               break;
            case 'profile':
               await ctx.reply('Переход в профиль...');
               await ctx.scene.enter('PROFILE_SCENE');
               break;
            default:
               await ctx.reply('Команда не найдена.');
               break;
         }
      }
      await next();
   };

   getStageMiddleware() {
      return this.stage.middleware();
   }
}