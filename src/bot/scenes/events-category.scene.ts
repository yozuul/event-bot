import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action, Command, On, Message } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { BotService } from '../bot.service';
import { categoryKeyboard } from '../keyboards';
import { CategoryService } from '@app/category/category.service';

@Scene('EVENTS_CATEGORY_SCENE')
@Injectable()
export class EventsCategoryScene {
   constructor(
      private readonly botService: BotService,
      private readonly categoryService: CategoryService,
   ) {}

   @SceneEnter()
   async onSceneEnter(@Ctx() ctx: Context) {
      await this.botService.sceneEnterCleaner(ctx)
      const msg = await this.showCategory(ctx);
      ctx.session.editCategory = { uz: '', ru: '', id: null }
      ctx.session.messageIdToEdit = msg.message_id;
   }

   async showCategory(@Ctx() ctx: Context) {
      let isEditMode = false;
      if (ctx.session.query === 'editCategory') {
         isEditMode = true;
      }
      const lang = ctx.session.language;
      const existCategory = await this.categoryService.findAll();
      const resultText = await this.genMessageTitle(ctx, existCategory.length)
      return ctx.reply(resultText, {
         reply_markup: {
            inline_keyboard: categoryKeyboard(lang, existCategory, isEditMode),
         },
      });
   }

   async updateCategory(@Ctx() ctx: Context) {
      const existCategory = await this.categoryService.findAll();
      const resultText = await this.genMessageTitle(ctx, existCategory.length)
      return ctx.telegram.editMessageText(
         ctx.chat.id, ctx.session.messageIdToEdit, undefined, resultText, {
            reply_markup: {
               inline_keyboard: categoryKeyboard(ctx.session.language, existCategory, true)
            }
         }
      );
   }

   @Action('add_category')
   async addCategory(@Ctx() ctx: Context) {
      ctx.session.editCategory = { uz: '', ru: '', id: null }
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language
      ctx.session.awaitingInput = 'uzName';
      const msg = await ctx.reply(lang == 'uz' ? 'Ўзбек тилида номини кўрсатинг:' : 'Укажите название на узбекском:');
      ctx.session.messageToDelete.push(msg.message_id);
   }

   @Action(/edit_category_(.+)/)
   async selectCategory(@Ctx() ctx: Context) {
      await this.getCategoryId(ctx)
      await this.editCategoryMessage(ctx, 'uzName')
   }

   @Action(/delete_category_(.+)/)
   async deleteCategory(@Ctx() ctx: Context) {
      await this.getCategoryId(ctx)
      await this.refreshCategoryData(ctx, 'delete');
   }

   @On('text')
   async handleTextInput(@Ctx() ctx: Context, @Message() message) {
      await this.botService.checkGlobalCommand(ctx, message.text, 'EVENTS_CATEGORY_SCENE')
      ctx.session.messageToDelete.push(message.message_id);
      if (ctx.session.awaitingInput === 'uzName') {
         ctx.session.editCategory.uz = message.text;
         await this.editCategoryMessage(ctx, 'ruName')
      } else if (ctx.session.awaitingInput === 'ruName') {
         ctx.session.editCategory.ru = message.text;
         await this.refreshCategoryData(ctx);
      }
   }

   async getCategoryId(@Ctx() ctx: Context) {
      if(ctx.callbackQuery && 'data' in ctx.callbackQuery) {
         ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id
         ctx.session.editCategory.id = ctx.callbackQuery.data.split('_')[2]
      }
   }

   async refreshCategoryData(@Ctx() ctx: Context, deleteCat?) {
      if(!deleteCat) {
         if(!ctx.session.editCategory.id) {
            await this.categoryService.create({
               uz: ctx.session.editCategory.uz, ru: ctx.session.editCategory.ru
            })
         }
         if(ctx.session.editCategory.id) {
            await this.categoryService.update(ctx.session.editCategory)
         }
      }
      if(deleteCat) {
         await this.categoryService.delete(ctx.session.editCategory.id)
      }
      await this.botService.clearChat(ctx)
      ctx.session.awaitingInput = null;
      await this.updateCategory(ctx)
   }

   async genMessageTitle(@Ctx() ctx: Context, categoryCount) {
      const messageText = {
         isCat: { uz: 'Категориялар:', ru: 'Категории:' },
         noCat: { uz: 'Категориялар топилмади', ru: 'Категорий не найдено' },
      };
      let resultText = messageText.isCat[ctx.session.language];
      if (categoryCount === 0) {
         resultText = messageText.noCat[ctx.session.language];
      }
      return resultText
   }

   async editCategoryMessage(@Ctx() ctx: Context, langTranslation) {
      const lang = ctx.session.language
      ctx.session.awaitingInput = langTranslation;
      let msg = null
      if(langTranslation === 'uzName') {
         msg = await ctx.reply(lang == 'uz' ? 'Ўзбек тилида номини кўрсатинг:' : 'Укажите название на узбекском:');
      }
      if(langTranslation === 'ruName') {
         msg = await ctx.reply(lang == 'uz' ? 'Рус тилида номини кўрсатинг:' : 'Укажите название на русском:');
      }
      ctx.session.messageToDelete.push(msg.message_id);
   }

   @On('callback_query')
   async checkCallback(@Ctx() ctx: Context) {
      await this.botService.checkGlobalActions(ctx, 'EVENTS_CATEGORY_SCENE')
   }
}