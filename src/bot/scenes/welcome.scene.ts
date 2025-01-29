import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, On, Message, Action } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { BotService } from '../bot.service';
import { CategoryService } from '@app/category/category.service';
import { categoryKeyboard } from '../keyboards';

@Scene('WELCOME_SCENE')
@Injectable()
export class WelcomeScene {
   constructor(
      private readonly botService: BotService,
      private readonly categoryService: CategoryService,
   ) {}

   @SceneEnter()
   async onSceneEnter(@Ctx() ctx: Context) {
      await this.botService.sceneEnterCleaner(ctx)
      const lang = ctx.session.language
      const message = {
         uz: 'Qiziqtirgan kategoriyani tanlang',
         ru: 'Выберите интересующую категорию',
      };
      await this.categoryService.createStarted()
      const existCategory = await this.categoryService.findAll()

      const msg = await ctx.reply(message[lang], {
         reply_markup: {
            inline_keyboard: categoryKeyboard(lang, existCategory, false),
         },
      })
      ctx.session.messageToDelete.push(msg.message_id)
   }

   @Action('show_all_events')
   async showAllAction(@Ctx() ctx: Context) {
      console.log('show_all_events')
      ctx.session.prevScene = 'WELCOME_SCENE'
      ctx.session.query = 'showAllEvents'
      await ctx.scene.enter('EVENTS_LIST_SCENE')
   }

   @Action('show_calendar')
   async showCalendar(@Ctx() ctx: Context) {
      ctx.session.prevScene = 'WELCOME_SCENE'
      ctx.session.query = 'showCalendar'
      await ctx.scene.enter('EVENT_CREATE_SCENE')
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
   }

   @On('callback_query')
   async checkCallback(@Ctx() ctx: Context) {
      await this.botService.checkGlobalActions(ctx, 'WELCOME_SCENE')
   }
}