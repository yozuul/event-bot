import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action, Command, On } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { LanguageKeyboard, TRANSLATION } from '../keyboards';
import { UsersService } from '@app/users/users.service';
import { BotService } from '../bot.service';

@Scene('EVENTS_LIST_SCENE')
@Injectable()
export class EventsScene {
   constructor(
      private readonly userService: UsersService,
      private readonly botService: BotService,
      private readonly languageKeyboard: LanguageKeyboard
   ) {}

   @Command('events')
   async profile(ctx: Context) {
      await this.botService.deleteDublicate(ctx)
      await this.botService.clearChat(ctx)
      await ctx.scene.enter('EVENTS_LIST_SCENE')
   }

   @SceneEnter()
   async onSceneEnter(@Ctx() ctx: Context) {
      const lang = ctx.session.language
      if(ctx.session.query === 'showAllUsersEvents') {
         await this.checkUsersEvents(ctx, lang)
      }
   }

   async checkUsersEvents(@Ctx() ctx: Context, lang) {
      const usersData = await this.userService.findByTgId(ctx.from.id)
      if(usersData.events.length === 0) {
         const prevMessage = TRANSLATION.EVENTS.NO_USER_EVENTS_MESSAGE
         const btnText = {
            addEvent: TRANSLATION.EVENTS.ADD_EVENT_BTN,
            showAll: TRANSLATION.EVENTS.SHOW_ALL_EVENT_BTN,
            goBack: TRANSLATION.EVENTS.GOBACK_EVENT_BTN,
         }
         try {
            const msg = await ctx.reply(prevMessage[lang], {
               reply_markup: {
                  inline_keyboard: [[
                     {
                        text: `${lang === 'uz' ? btnText.addEvent.uz : btnText.addEvent.ru}`,
                        callback_data: 'add_event',
                     }],
                     [{
                        text: `${lang === 'uz' ? btnText.showAll.uz : btnText.showAll.ru}`,
                        callback_data: 'show_all',
                     },
                     {
                        text: `${lang === 'uz' ? btnText.goBack.uz : btnText.goBack.ru}`,
                        callback_data: 'go_back',
                     }],
                  ],
               },
            });
            ctx.session.messageToDelete.push(msg.message_id)
         } catch (error) {
            await ctx.reply('Ошибка вывода клавиатуры.\nПопробуйте перезапустить сценарий /events')
         }
      }
   }

//    @Action('add_event')
//    async addEvent(@Ctx() ctx: Context) {
//       await this.botService.clearChat(ctx)
//       ctx.answerCbQuery('Добавление мероприятия');
//       await ctx.scene.enter('EVENT_CREATE_SCENE')
//    }
//
//    @Action('show_all')
//    async showAll(@Ctx() ctx: Context) {
//       await this.botService.clearChat(ctx)
//       await ctx.answerCbQuery('Все мероприятия');
//       // ctx.scene.enter(ctx.session.prevScene)
//    }
//
//    @Action('go_back')
//    async goBack(@Ctx() ctx: Context) {
//       await this.botService.clearChat(ctx)
//       await ctx.answerCbQuery('Назад');
//       await ctx.scene.enter(ctx.session.prevScene)
//    }
//
//    @On('callback_query')
//    async checkCallback(@Ctx() ctx: Context) {
//       await ctx.deleteMessage()
//       await ctx.answerCbQuery('Сообщение устарело');
//    }
}