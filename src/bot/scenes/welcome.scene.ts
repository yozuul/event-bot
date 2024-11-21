import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Hears, On, Ctx, Start, Sender, Action } from 'nestjs-telegraf'
import { Context } from '../context.interface';
import { UsersService } from 'src/users/users.service';

@Scene('WELCOME_SCENE')
@Injectable()
export class WelcomeScene {
   constructor(
      private readonly usersService: UsersService
   ) {}

   @SceneEnter()
   async onSceneEnter(@Ctx() ctx: Context) {
      const userLanguage = ctx.session.language
      const messages = {
         uz: 'Хуш келибсиз!\nУшбу бота Тошкентдаги тадбирлар ҳақидаги маълумотлар нашр этилади. \nБошлаш учун чапдаги менюни ишлатинг.',
         ru: 'Добро пожаловать!\nВ этом боте публикуется информация о мероприятиях в Ташкенте. \nИспользуйте меню слева, чтобы начать.',
      };
      await ctx.reply(messages[userLanguage] || messages['ru']);
   }
}