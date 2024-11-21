import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action, Command } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { LanguageKeyboard } from '../keyboards';
import { UsersService } from '@app/users/users.service';

@Scene('EVENTS_SCENE')
@Injectable()
export class EventsScene {
   constructor(
      private readonly userService: UsersService,
      private readonly languageKeyboard: LanguageKeyboard
   ) {}

   @Command('events')
   async profile(ctx: Context) {
      ctx.scene.enter('EVENTS_SCENE')
   }

   @SceneEnter()
   async onSceneEnter(@Ctx() ctx: Context) {
      const lang = ctx.session.language
      if(ctx.session.query === 'showAllUsersEvents') {
         const usersEvents = await this.userService.findByTgId(ctx.from.id)
         if(usersEvents.events.length === 0) {
            const prevMessage = {
               uz: 'Сиз ҳали бирор тадбир қўшмadingiz',
               ru: 'Вы пока не добавили ни одного мероприятия'
            }
            await ctx.reply(prevMessage[lang], {
               reply_markup: {
                  inline_keyboard: [[
                     {
                        text: `${lang === 'uz' ? 'Тадбир қўшиш' : 'Добавить мероприятие'}`,
                        callback_data: 'add_event',
                     },
                     {
                        text: `${lang === 'uz' ? '⬅️ Орқа' : '⬅️ Назад'}`,
                        callback_data: 'go_back',
                     },
                  ]],
               },
            });
         }
      }
      await this.languageKeyboard.showLanguageMenu(ctx);
   }

   @Action('set_lang_uz')
   async setUzbekLanguage(@Ctx() ctx: Context) {
      ctx.session.language = 'uz';
      await ctx.answerCbQuery('Танланган тил — ўзбек тили');
      await this.languageKeyboard.updateLanguageMenu(ctx);
   }

   @Action('set_lang_ru')
   async setRussianLanguage(@Ctx() ctx: Context) {
      ctx.session.language = 'ru';
      await ctx.answerCbQuery('Выбран русский язык');
      await this.languageKeyboard.updateLanguageMenu(ctx);
   }

   @Action('go_to_welcome')
   async goToWelcomeScene(@Ctx() ctx: Context) {
      await ctx.deleteMessage()
      ctx.scene.enter('WELCOME_SCENE')
   }
}