import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action, On, Command, Message, Start } from 'nestjs-telegraf';
import { Context } from '../context.interface';

import { profileKeyboard } from '../keyboards';
import { UsersService } from '@app/users/users.service';
import { BotService } from '../bot.service';
import { EventsService } from '@app/events/events.service';

@Scene('PROFILE_SCENE')
@Injectable()
export class ProfileScene {
   private profileText: string = '';
   constructor(
      private readonly userService: UsersService,
      private readonly botService: BotService,
   ) {}

   @SceneEnter()
   async onSceneEnter(@Ctx() ctx: Context) {
      await this.botService.sceneEnterCleaner(ctx)
      ctx.session.user = await this.userService.findByTgId(ctx.from.id);
      const profileMessage = await this.showProfile(ctx);
      ctx.session.messageIdToEdit = profileMessage.message_id;
   }

   private async showProfile(ctx: Context) {
      const lng = ctx.session.language || 'ru';
      await this.genProfileText(ctx);
      return ctx.replyWithPhoto(
         ctx.session.user.avatar || 'https://via.placeholder.com/300',
         {
            caption: this.profileText,
            reply_markup: {
               inline_keyboard: profileKeyboard(lng),
            },
         },
      );
   }

   async genProfileText(ctx: Context) {
      const lng = ctx.session.language || 'ru';
      const t = (uz: string, ru: string) => (lng === 'uz' ? uz : ru);
      const noData = t(`Ko'rsatilmagan`, 'Не указано');
      const fields = [
         { label: t('Ism', 'Имя'), value: ctx.session.user.name },
         { label: t('Yosh', 'Возраст'), value: ctx.session.user.age },
         { label: t('Telefon', 'Телефон'), value: ctx.session.user.phone },
      ];
      this.profileText = fields
         .map(field => `${field.label}: ${field.value || noData}`)
         .join('\n');
   }

   async updateProfileInfo(ctx: Context) {
      this.genProfileText(ctx)
      try {
         await ctx.telegram.editMessageMedia(
            ctx.chat.id, ctx.session.messageIdToEdit, undefined,
            {
               type: 'photo',
               media: ctx.session.user.avatar || 'https://via.placeholder.com/300',
               caption: this.profileText,

            },
            {
               reply_markup: {
                  inline_keyboard: profileKeyboard(ctx.session.language),
               },
            }
         );
      } catch (error) {
         console.log(error)
         console.log('Ошибка обновления профиля. Попробуйте перезапустить раздел /profile')
      }
   }

   @Action('edit_name')
   async editName(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language
      const msg = await ctx.reply(lang == 'uz' ? 'Yangi ismingizni kiriting:' : 'Введите новое имя:');
      ctx.session.awaitingInput = 'name';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   @Action('edit_photo')
   async editPhoto(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language
      const msg = await ctx.reply(lang == 'uz' ? 'Yangi fotosuratni yuboring:' : 'Отправьте новую фотографию:');
      ctx.session.awaitingInput = 'photo';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   @Action('edit_age')
   async editAge(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language
      const msg = await ctx.reply(lang == 'uz' ? 'Yangi yoshni kiriting:' : 'Введите новый возраст:');
      ctx.session.awaitingInput = 'age';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   @Action('edit_phone')
   async editPhone(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language
      const msgText = lang == 'uz' ? 'Iltimos, telefon raqamingizni yuboring.' : 'Пожалуйста, отправьте свой номер телефона.'
      const btnText = lang == 'uz' ? '📞 Telefon raqamini yuboring' : '📞 Отправить номер телефона'
      const msg = await ctx.reply(msgText, {
         reply_markup: {
            keyboard: [
               [{ text: btnText, request_contact: true }]
            ],
            one_time_keyboard: true,
            resize_keyboard: true,
         },
      });
      ctx.session.awaitingInput = 'phone';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   @On('text')
   async handleTextInput(@Ctx() ctx: Context, @Message() message) {
      console.log('message.text', message.text)
      await this.botService.checkGlobalCommand(ctx, message.text, 'PROFILE_SCENE')
      ctx.session.messageToDelete.push(message.message_id);
      const lang = ctx.session.language
      if (ctx.session.awaitingInput === 'name') {
         ctx.session.user.name = message.text;
         await this.refreshData(ctx)
      } else if (ctx.session.awaitingInput === 'age') {
         ctx.session.user.age = Number(message.text);
         if(!ctx.session.user.age) {
            const msg = await ctx.reply(lang === 'uz' ? 'Faqat raqamlar' : 'Только цифры');
            ctx.session.messageToDelete.push(msg.message_id);
            return
         }
         await this.refreshData(ctx)
      } else if (ctx.session.awaitingInput === 'photo') {
         const msgText = lang === 'uz' ? 'Rasmni yuklang' : 'Загрузите фото'
         const msg = await ctx.reply(msgText);
         ctx.session.messageToDelete.push(msg.message_id);
      }
   }

   @On('photo')
   async handlePhotoInput(@Ctx() ctx: Context, @Message() message) {
      ctx.session.messageToDelete.push(message.message_id);
      if (ctx.session.awaitingInput === 'photo') {
         if (message.photo && message.photo.length > 0) {
            const photoId = message.photo[message.photo.length - 1].file_id;
            ctx.session.user.avatar = photoId
         } else {
            await ctx.reply('Ошибка: не удалось получить фотографию. Попробуйте еще раз.');
         }
         await this.refreshData(ctx)
      }
   }

   @On('contact')
   async cintactMessage(@Ctx() ctx: Context, @Message() message) {
      ctx.session.messageToDelete.push(message.message_id);
      ctx.session.user.phone = message.contact.phone_number
      await this.refreshData(ctx)
   }

   @Action('set_lang_uz')
   async setUzbekLanguage(@Ctx() ctx: Context) {
      console.log('BEFORE', ctx.session.messageIdToEdit)
      ctx.session.messageIdToEdit = ctx.callbackQuery?.message?.message_id;
      ctx.session.language = 'uz';
      ctx.session.user.language =  ctx.session.language
      await ctx.answerCbQuery(`O'zbek tili tanlandi`);
      await this.updateProfileInfo(ctx)
      await this.userService.update(ctx.from.id, ctx.session.user)
      console.log('AFTER', ctx.session.messageIdToEdit)
   }

   @Action('set_lang_ru')
   async setRussianLanguage(@Ctx() ctx: Context) {
      console.log('BEFORE', ctx.session.messageIdToEdit)
      ctx.session.messageIdToEdit = ctx.callbackQuery?.message?.message_id;
      ctx.session.language = 'ru';
      ctx.session.user.language =  ctx.session.language
      await ctx.answerCbQuery('Выбран русский язык');
      await this.updateProfileInfo(ctx)
      await this.userService.update(ctx.from.id, ctx.session.user)
      console.log('AFTER', ctx.session.messageIdToEdit)
   }

   @Action('my_events')
   async myEvents(@Ctx() ctx: Context) {
      console.log('show_all_users_events')
      ctx.session.prevScene = 'PROFILE_SCENE'
      ctx.session.query = 'showAllUsersEvents'
      await ctx.scene.enter('EVENTS_LIST_SCENE')
   }

   @Action('add_event')
   async addEvent(@Ctx() ctx: Context) {
      const userId = ctx.from.id;
      const lang = ctx.session.language
      try {
         const member = await ctx.telegram.getChatMember(process.env.ORGANISATION_GROUP, userId);
         // Проверяем статус пользователя
         if (['member', 'administrator', 'creator'].includes(member.status)) {
            ctx.session.query = 'addNewEvent'
            ctx.session.prevScene = 'PROFILE_SCENE'
            await ctx.answerCbQuery('Добавление мероприятия');
            await ctx.scene.enter('EVENT_CREATE_SCENE')
         } else {
            const text = lang === 'uz' ? `Adminstratsiya bilan bog'laning, kirish huquqini olish uchun:` : 'Свяжитесь с администрацией для предоставления доступа:'
            const msg = await ctx.reply(text + ` ${process.env.FEEDBACK_CHANNEL_URL}`);
            ctx.session.messageToDelete.push(msg.message_id)
            await ctx.answerCbQuery(lang === 'uz' ? `Hozirda siz tadbirlar qo'shishingiz mumkin emas` : 'Вы пока не можете добавлять мероприятия');
         }
      } catch (error) {
         console.error('Ошибка проверки статуса:', error);
         await ctx.reply('Не удалось проверить статус. Убедитесь, что бот является администратором группы/канала.');
      }

   }

   async refreshData(ctx) {
      await this.updateProfileInfo(ctx)
      await this.botService.clearChat(ctx)
      await this.userService.update(ctx.from.id, ctx.session.user)
      ctx.session.awaitingInput = null;
   }

   @On('callback_query')
   async checkCallback(@Ctx() ctx: Context) {
      await this.botService.checkGlobalActions(ctx, 'EVENT_CREATE_SCENE')
   }
}