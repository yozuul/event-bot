import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action, Command, On, Message, Start } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { BotService } from '../bot.service';
import { EventsKeyboard, languageKeyboard } from '../keyboards';
import { UsersService } from '@app/users/users.service';
import { EventsService } from '@app/events/events.service';

@Scene('SETTINGS_SCENE')
@Injectable()
export class SettingsScene {
   constructor(
      private readonly botService: BotService,
      private readonly userService: UsersService,
      private readonly eventsService: EventsService,
      private readonly eventsKeyboard: EventsKeyboard,
   ) {}

   @SceneEnter()
   async onSceneEnter(@Ctx() ctx: Context) {
      await this.botService.sceneEnterCleaner(ctx)
      const lang = ctx.session.language || 'uz';
      const msg = await this.showLanguageKeyboard(ctx, lang);
      ctx.session.messageIdToEdit = msg.message_id
      await this.updateCommand(ctx)
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

   async updateCommand(@Ctx() ctx: Context) {
      // const t = (uz, ru) => (ctx.session.language === "uz" ? uz : ru)
      const t = (uz, ru) => (`${uz} / ${ru}`)
      await ctx.telegram.setMyCommands(
         [
            { command: 'events', description: t('Барча тадбирлар', 'Все мероприятия') },
            { command: 'my_events', description: t('Менинг тадбирларим', 'Мои мероприятия') },
            { command: 'add_event', description: t('Тадбир қўшиш', 'Добавить мероприятие') },
            { command: 'welcome', description: t('Категориялар', 'Категории') },
            { command: 'profile', description: t('Менинг профилим', 'Мой профиль') },
            { command: 'start', description: t('Ботни қайта ишга тушириш', 'Перезапустить бота') },
         ],
         { scope: { type: 'all_private_chats' } }
      );
      // console.log(await ctx.telegram.getMyCommands())
   }


   @On('text')
   async handleTextInput(@Ctx() ctx: Context, @Message() message) {
      await this.botService.checkGlobalCommand(ctx, message.text, 'EVENTS_LIST_SCENE')
      ctx.session.messageToDelete.push(message.message_id);
   }

   @On('callback_query')
   async checkCallback(@Ctx() ctx: Context) {
      console.log('callback_query LANGUAGE_SCENE')
      await this.botService.checkGlobalActions(ctx, 'LANGUAGE_SCENE')
   }
}