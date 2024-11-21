import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action } from 'nestjs-telegraf';
import { Context } from '../context.interface';
import { LanguageKeyboard } from '../keyboards';

@Scene('LANGUAGE_SCENE')
@Injectable()
export class LanguageScene {
   constructor(
      private readonly languageKeyboard: LanguageKeyboard
   ) {}
   @SceneEnter()
   async onSceneEnter(@Ctx() ctx: Context) {
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