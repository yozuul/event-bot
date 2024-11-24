import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action, Command, On, Message } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { BotService } from '../bot.service';
import { languageKeyboard } from '../keyboards';
import { UsersService } from '@app/users/users.service';

@Scene('SETTINGS_SCENE')
@Injectable()
export class SettingsScene {
   constructor(
      private readonly botService: BotService,
      private readonly userService: UsersService,
   ) {}

   @SceneEnter()
   async onSceneEnter(@Ctx() ctx: Context) {
      await this.botService.sceneEnterCleaner(ctx)
      const lang = ctx.session.language || 'uz';
      const msg = await this.showLanguageKeyboard(ctx, lang);
      ctx.session.messageIdToEdit = msg.message_id
   }

   async showLanguageKeyboard(@Ctx() ctx: Context, lang) {
      const checkUser = await this.userService.findByTgId(ctx.from.id)
      const isAdmin = checkUser.admin
      return ctx.reply('Tilni tanlang / Выберите язык:', {
         reply_markup: {
            inline_keyboard: languageKeyboard(lang, isAdmin),
         },
      });
   }

   async updateLanguageKeyboard(@Ctx() ctx: Context, lang) {
      const checkUser = await this.userService.findByTgId(ctx.from.id)
      const isAdmin = checkUser.admin
      return ctx.editMessageReplyMarkup({
         inline_keyboard: languageKeyboard(lang, isAdmin)
      });
   }

   @Action('set_lang_uz')
   async setUzbekLanguage(@Ctx() ctx: Context) {
      await ctx.answerCbQuery('Танланган тил — ўзбек тили');
      await this.updateLanguage(ctx, 'uz')
   }

   @Action('set_lang_ru')
   async setRussianLanguage(@Ctx() ctx: Context) {
      await ctx.answerCbQuery('Выбран русский язык');
      await this.updateLanguage(ctx, 'ru')
   }

   @Action('edit_category')
   async editCategory(@Ctx() ctx: Context) {
      ctx.session.query = 'editCategory'
      ctx.session.prevScene = 'SETTINGS_SCENE'
      await ctx.answerCbQuery('Редактирование категорий');
      await ctx.scene.enter('EVENTS_CATEGORY_SCENE')
   }

   @Action('show_moderate')
   async showModerate(@Ctx() ctx: Context) {
      ctx.session.query = 'showModerateEvents'
      ctx.session.prevScene = 'SETTINGS_SCENE'
      await ctx.answerCbQuery('Показать категории на модерации');
      await ctx.scene.enter('EVENTS_LIST_SCENE')
   }

   @Action('go_to_welcome')
   async goToWelcomeScene(@Ctx() ctx: Context) {
      ctx.session.prevScene = 'SETTINGS_SCENE'
      await ctx.scene.enter('WELCOME_SCENE')
   }

   async updateLanguage(@Ctx() ctx: Context, lang: string) {
      ctx.session.language = lang;
      if(ctx.session.user?.language) {
         ctx.session.user.language = lang;
      }
      await this.updateLanguageKeyboard(ctx, lang);
      const user = await this.userService.findByTgId(ctx.from.id)
      if(user) {
         try {
            user.language = lang
            await user.save()
         } catch (error) {
            console.log('Ошибка обновления языка пользователя в БД')
         }
      }
   }

   @On('text')
   async handleTextInput(@Ctx() ctx: Context, @Message() message) {
      await this.botService.checkGlobalCommand(ctx, message.text, 'EVENTS_LIST_SCENE')
      ctx.session.messageToDelete.push(message.message_id);
   }

   @On('callback_query')
   async checkCallback(@Ctx() ctx: Context) {
      await this.botService.checkGlobalActions(ctx, 'LANGUAGE_SCENE')
   }
}