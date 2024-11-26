import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, On, Message, Action, Start } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { UsersService } from 'src/users/users.service';
import { BotService } from '../bot.service';
import { EventsService } from '@app/events/events.service';
import { CategoryService } from '@app/category/category.service';
import { categoryKeyboard } from '../keyboards';

@Scene('WELCOME_SCENE')
@Injectable()
export class WelcomeScene {
   constructor(
      private readonly botService: BotService,
      private readonly usersService: UsersService,
      private readonly eventsService: EventsService,
      private readonly categoryService: CategoryService
   ) {}

   @SceneEnter()
   async onSceneEnter(@Ctx() ctx: Context) {
      await this.botService.sceneEnterCleaner(ctx)
      const lang = ctx.session.language
      const message = {
         uz: 'Хуш келибсиз!\nУшбу бота Тошкентдаги тадбирлар ҳақидаги маълумотлар нашр этилади. \nБошлаш учун чапдаги менюни ишлатинг.',
         ru: 'Добро пожаловать!\nВ этом боте публикуется информация о мероприятиях в Ташкенте. \nИспользуйте меню слева, чтобы начать.',
      };
      await this.categoryService.createStarted()
      const existCategory = await this.categoryService.findAll()

      const msg = await ctx.reply(message[lang], {
         reply_markup: {
            inline_keyboard: categoryKeyboard(lang, existCategory, false),
         },
      })
      ctx.session.messageIdToEdit = msg.message_id
   }

   @Action('show_all_events')
   async showAllAction(@Ctx() ctx: Context) {
      ctx.session.prevScene = 'WELCOME_SCENE'
      await ctx.scene.enter('EVENTS_LIST_SCENE')
   }

   @Action(/select_category_(.+)/)
   async selectCategory(@Ctx() ctx: Context) {
      if ('data' in ctx.callbackQuery && ctx.callbackQuery.data) {
         const selectedCategoryId = ctx.callbackQuery.data.split('_')[2]
         ctx.session.showCategory = selectedCategoryId
         ctx.session.query = 'showCategory'
      }
      ctx.session.prevScene = 'WELCOME_SCENE'
      await ctx.scene.enter('EVENTS_LIST_SCENE')
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