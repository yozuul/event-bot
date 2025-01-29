import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action, Command, On, Message, Start } from 'nestjs-telegraf';

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
      console.log('SETTINGS_SCENE')
      const lang = ctx.session.language || 'uz';
      const user = await this.userService.findByTgId(ctx.from.id)
      if(!user.phone) {
         await this.showPhoneKeyboard(ctx, lang);
         return
      }
      await this.botService.sceneEnterCleaner(ctx)
      let msg
      msg = await this.showLanguageKeyboard(ctx, lang);
      ctx.session.messageIdToEdit = msg.message_id
      // this.updateCommand(ctx)
   }


   async showPhoneKeyboard(@Ctx() ctx: Context, lang) {
      const msgText = 'Botga kirish uchun telefon raqamingizni kiriting. \nДля доступа к боту, укажите свой номер телефона.';
      const btnText = '📞 Telefon raqamingizni yuboring. / Отправить номер телефона'

      const msg = await ctx.reply(msgText, {
         reply_markup: {
            keyboard: [
               [{ text: btnText, request_contact: true }]
            ],
            one_time_keyboard: true,
            resize_keyboard: true,
         },
         parse_mode: 'Markdown'
      });
      ctx.session.messageIdToEdit = msg.message_id
      // ctx.session.messageToDelete.push(msg.message_id);
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

   @On('contact')
   async cintactMessage(@Ctx() ctx: Context, @Message() message) {
      const checkUser = await this.userService.findByTgId(ctx.from.id)
      ctx.session.messageToDelete.push(message.message_id);
      ctx.session.user.phone = message.contact.phone_number
      checkUser.phone = ctx.session.user.phone
      const text = {
         uz: 'Samarqanddagi barcha tadbirlar haqidagi botga xush kelibsiz',
         ru: 'Добро пожаловать в бот о всех мероприятиях Самарканда',
      }
      await checkUser.save()
      await ctx.reply(`📢\n${text['uz']} \n${text['ru']}`)
      await ctx.scene.enter('SETTINGS_SCENE')
   }

   @Action('set_lang_uz')
   async setUzbekLanguage(@Ctx() ctx: Context) {
      await ctx.answerCbQuery(`O'zbek tili tanlandi`);
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

   @Action('update_admins')
   async updateAdmin(@Ctx() ctx: Context) {
      await this.userService.disableAdminRights()
      const channelAdmins = await ctx.telegram.getChatAdministrators(process.env.ADMIN_CHANNEL);
      for (let admin of channelAdmins) {
         if(!admin.user.is_bot) {
            try {
               const user = await this.userService.findByTgId(admin.user.id)
               user.admin = true
               await user.save()
               await ctx.answerCbQuery('Админы обновлены');
            } catch (error) {
               console.log('Ошибка обновления админов')
               await ctx.answerCbQuery('Ошибка обновления админов');
            }
         }
      }
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
            { command: 'welcome', description: t('Kategoriyalar', 'Категории') },
            { command: 'my_events', description: t('Mening tadbirlarim', 'Мои мероприятия') },
            { command: 'profile', description: t('Mening profilingiz', 'Мой профиль') },
            { command: 'start', description: t('Botni qayta ishga tushurish', 'Перезапустить бота') },
            // { command: 'events', description: t('Барча тадбирлар', 'Все мероприятия') },
            // { command: 'add_event', description: t('Тадбир қўшиш', 'Добавить мероприятие') },
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