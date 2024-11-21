import { Injectable } from '@nestjs/common';
import { Command, Ctx, Hears, InjectBot, Message, On, Start, Update, Action } from 'nestjs-telegraf';
import { Telegraf, Markup } from 'telegraf';

import { Context } from './context.interface';
import { UsersService } from 'src/users/users.service';
import { menuCommand } from './keyboards/menu-command';

@Injectable()
@Update()
export class BotUpdate {
   constructor(
      @InjectBot()
         private readonly bot: Telegraf<Context>,
         private readonly userService: UsersService
   ) {}

   private async setCommands(language) {
      await this.bot.telegram.setMyCommands(
         menuCommand[language],
         { language_code: language },
      );
   }

   @Start()
   async startCommand(ctx: Context) {
      this.setCommands(ctx.session.language);
      const user = await this.userService.findByTgId(ctx.from.id);
      if (user) {
         await this.userService.create(ctx.from);
         await ctx.scene.enter('LANGUAGE_SCENE');
      } else {
         await ctx.reply(`Добро пожаловать обратно, ${user.name || 'Гость'}!`);
      }
   }

   @Command('profile')
   async profile(ctx: Context) {
      await ctx.scene.enter('PROFILE_SCENE')
   }

   @On('message')
   async onMessage(ctx: Context) {
      console.log('dsdfff')
      // console.log('Тест', ctx.message);
   }
}