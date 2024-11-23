import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action, On, Command, Message } from 'nestjs-telegraf';
import { Context } from '../context.interface';

import { profileKeyboard } from '../keyboards';
import { UsersService } from '@app/users/users.service';
import { BotService } from '../bot.service';

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
      const noData = t('кўрсатилмаган', 'не указано');
      const fields = [
         { label: t('Исм', 'Имя'), value: ctx.session.user.name },
         { label: t('Ёш', 'Возраст'), value: ctx.session.user.age },
         { label: t('Телефон', 'Телефон'), value: ctx.session.user.phone },
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
      const msg = await ctx.reply(lang == 'uz' ? 'Янги исмни киритинг' : 'Введите новое имя:');
      ctx.session.awaitingInput = 'name';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   @Action('edit_photo')
   async editPhoto(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language
      const msg = await ctx.reply(lang == 'uz' ? 'Янги расмни юборинг' : 'Отправьте новую фотографию:');
      ctx.session.awaitingInput = 'photo';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   @Action('edit_age')
   async editAge(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language
      const msg = await ctx.reply(lang == 'uz' ? 'Янги ёшни киритинг' : 'Введите новый возраст:');
      ctx.session.awaitingInput = 'age';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   @Action('edit_phone')
   async editPhone(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language
      const msgText = lang == 'uz' ? 'Илтимос, телефон рақамингизни юборинг.' : 'Пожалуйста, отправьте свой номер телефона.'
      const btnText = lang == 'uz' ? '📞 Телефон рақамини юбориш' : '📞 Отправить номер телефона'
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
      await this.botService.checkGlobalCommand(ctx, message.text, 'PROFILE_SCENE')
      ctx.session.messageToDelete.push(message.message_id);
      const lang = ctx.session.language
      if (ctx.session.awaitingInput === 'name') {
         ctx.session.user.name = message.text;
         await this.refreshData(ctx)
      } else if (ctx.session.awaitingInput === 'age') {
         ctx.session.user.age = Number(message.text);
         if(!ctx.session.user.age) {
            const msg = await ctx.reply(lang === 'uz' ? 'Фақат рақамлар' : 'Только цифры');
            ctx.session.messageToDelete.push(msg.message_id);
            return
         }
         await this.refreshData(ctx)
      } else if (ctx.session.awaitingInput === 'photo') {
         const msgText = lang === 'uz' ? 'Расмни юкланг' : 'Загрузите фото'
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
      ctx.session.messageIdToEdit = ctx.callbackQuery?.message?.message_id;
      ctx.session.language = 'uz';
      ctx.session.user.language =  ctx.session.language
      await ctx.answerCbQuery('Танланган тил — ўзбек тили');
      await this.updateProfileInfo(ctx)
      await this.userService.update(ctx.from.id, ctx.session.user)
   }

   @Action('set_lang_ru')
   async setRussianLanguage(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery?.message?.message_id;
      ctx.session.language = 'ru';
      ctx.session.user.language =  ctx.session.language
      await ctx.answerCbQuery('Выбран русский язык');
      await this.updateProfileInfo(ctx)
      await this.userService.update(ctx.from.id, ctx.session.user)
   }

   @Action('my_events')
   async myEvents(@Ctx() ctx: Context) {
      ctx.session.query = 'showAllUsersEvents'
      ctx.session.prevScene = 'PROFILE_SCENE'
      await ctx.answerCbQuery();
      await ctx.scene.enter('EVENTS_LIST_SCENE')
   }

   @Action('add_event')
   async addEvent(@Ctx() ctx: Context) {
      ctx.session.query = 'addNewEvent'
      ctx.session.prevScene = 'PROFILE_SCENE'
      await ctx.answerCbQuery('Добавление мероприятия');
      await ctx.scene.enter('EVENT_CREATE_SCENE')
   }

   @Action('go_back')
   async goBack(@Ctx() ctx: Context) {
      // await this.botService.resetSession(ctx)
      await ctx.answerCbQuery('Сессия очищена');
   }

   @On('callback_query')
   async checkCallback(@Ctx() ctx: Context) {
      await ctx.deleteMessage()
      await ctx.answerCbQuery('Сообщение устарело');
      console.log('Удаление сообщения из PROFILE_SCENE')
   }

   async refreshData(ctx) {
      await this.updateProfileInfo(ctx)
      await this.botService.clearChat(ctx)
      await this.userService.update(ctx.from.id, ctx.session.user)
      ctx.session.awaitingInput = null;
   }
}