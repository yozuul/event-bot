import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action, Command, On, Message } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { eventKeyboard, LanguageKeyboard } from '../keyboards';
import { EventsService } from '@app/events/events.service';
import { CalendarService, TimeSelectionService } from '../date-services';

@Scene('EVENT_CREATE_SCENE')
@Injectable()
export class EventCreateScene {
   private eventText: string;
   constructor(
      private readonly eventService: EventsService,
      private readonly calendarService: CalendarService,
      private readonly timeService: TimeSelectionService,
      private readonly languageKeyboard: LanguageKeyboard
   ) {}

   @Command('add_event')
   async events(ctx: Context) {
      ctx.scene.enter('EVENT_CREATE_SCENE');
   }

   @SceneEnter()
   async onSceneEnter(@Ctx() ctx: Context) {
      const lang = ctx.session.language;
      ctx.session.currentEvent = {
         name: '', photo: '', description: '', date: '', price: '',
         category: '', phone: '', status: '⛔️ Не опубликовано',
         selectedYear: null, selectedMonth: null, selectedTime: null, eventFullDate: ''

      };
      await this.showEventTemplate(ctx);
   }

   private async showEventTemplate(ctx: Context) {
      const lng = ctx.session.language || 'ru';
      if (ctx.session.messageToDelete.length > 0) {
         await this.clearChat(ctx);
      }
      await this.genEventText(ctx);
      const sentMessage = await ctx.replyWithPhoto(
         ctx.session.currentEvent.photo || 'https://via.placeholder.com/300',
         {
            caption: this.eventText,
            reply_markup: {
               inline_keyboard: eventKeyboard(lng),
            },
         },
      );
      ctx.session.messageToDelete.push(sentMessage.message_id);
      ctx.session.messageIdToEdit = sentMessage.message_id;
   }

   async genEventText(ctx: Context) {
      const lng = ctx.session.language || 'ru';
      const t = (uz: string, ru: string) => (lng === 'uz' ? uz : ru);
      const noData = t('кўрсатилмаган', 'не указано');

      const event = ctx.session.currentEvent;
      const fields = [
         { label: t('Номи', 'Название'), value: event.name },
         { label: t('Расм', 'Фото'), value: event.photo },
         { label: t('Тавсиф', 'Описание'), value: event.description },
         { label: t('Сана', 'Дата'), value: event.date },
         { label: t('Нархи', 'Стоимость'), value: event.price },
         { label: t('Категория', 'Категория'), value: event.category },
         { label: t('Телефон', 'Телефон'), value: event.phone },
         { label: t('Ҳолат', 'Статус'), value: event.status },
      ];
      this.eventText = fields
         .map(field => `${field.label}: ${field.value || noData}`)
         .join('\n');
   }

   @Action('save_event')
   async saveEvent(@Ctx() ctx: Context) {
      await this.clearChat(ctx);
      ctx.answerCbQuery('Мероприятие отправлено на проверку');
      await this.eventService.createEvent(ctx.session.currentEvent);
      ctx.scene.enter(ctx.session.prevScene);
   }

   @Action('edit_event_name')
   async editEventName(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const msg = await ctx.reply(lang === 'uz' ? 'Янги номини киритинг' : 'Введите новое название мероприятия:');
      ctx.session.awaitingInput = 'name';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   @Action('edit_event_photo')
   async editPhoto(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language
      const msg = await ctx.reply(lang == 'uz' ? 'Янги расмни юборинг' : 'Отправьте новую фотографию:');
      ctx.session.awaitingInput = 'photo';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   @Action('edit_event_description')
   async editEventDescription(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const msg = await ctx.reply(lang === 'uz' ? 'Янги тавсифини киритинг' : 'Введите новое описание мероприятия:');
      ctx.session.awaitingInput = 'description';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   @Action('edit_event_date')
   async editEventDate(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const msg = await ctx.reply(lang === 'uz' ? 'Янги санани киритинг' : 'Введите новую дату мероприятия:');
      ctx.session.awaitingInput = 'date';
      ctx.session.messageToDelete.push(msg.message_id);

      const now = new Date();
      const calendar = this.calendarService.generateCalendar(now.getFullYear(), now.getMonth(), lang);
      await ctx.reply('Выберите дату:', { reply_markup: calendar });
   }

   @Action(/change_month_(\d+)_(\d+)/)
   async changeMonth(@Ctx() ctx: Context) {
      const lang = ctx.session.language;
      let match = null
      if ('data' in ctx.callbackQuery && ctx.callbackQuery.data) {
         match = ctx.callbackQuery.data.match(/change_month_(\d+)_(\d+)/);
      }
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const calendar = this.calendarService.generateCalendar(year, month, lang);
      await ctx.editMessageReplyMarkup(calendar);
   }

   @Action(/select_day_(\d+)/)
   async selectDay(@Ctx() ctx: Context) {
      let match = null;
      if ('data' in ctx.callbackQuery && ctx.callbackQuery.data) {
         match = ctx.callbackQuery.data.match(/select_day_(\d+)/);
      }
      const day = parseInt(match[1], 10);

      const now = new Date();
      const year = ctx.session.currentEvent.selectedYear || now.getFullYear();
      const month = ctx.session.currentEvent.selectedMonth || now.getMonth();

      const selectedDate = new Date(year, month, day);
      ctx.session.currentEvent.date = selectedDate.toISOString();

      await ctx.answerCbQuery(`Дата выбрана: ${selectedDate.toLocaleDateString()}`);

      // Проверяем, если выбранная дата - сегодня
      const isToday = selectedDate.toDateString() === now.toDateString();

      // Устанавливаем начальное время
      ctx.session.currentEvent.selectedTime = {
         hour: isToday ? now.getHours() : 0,
         minute: isToday ? now.getMinutes() : 0,
      };

      // Переходим к выбору времени
      await this.selectTime(ctx);
   }

   @Action(/^select_time$/)
   async selectTime(@Ctx() ctx: Context) {
      const { hour, minute } = ctx.session.currentEvent.selectedTime;
      const keyboard = this.timeService.generateTimeKeyboard(hour, minute);

      await ctx.reply('Выберите время:', { reply_markup: keyboard });
   }

   @Action(/^increment_(hour|minute)$/)
   @Action(/^decrement_(hour|minute)$/)
   async adjustTime(@Ctx() ctx: Context) {
      const now = new Date();
      const selectedDate = new Date(ctx.session.currentEvent.date);
      const { hour, minute } = ctx.session.currentEvent.selectedTime;
      let action
      if ('data' in ctx.callbackQuery && ctx.callbackQuery.data) {
         action = ctx.callbackQuery?.data;
      }

      let updatedTime = this.timeService.adjustTime(hour, minute, action);

      // Если выбранная дата - сегодня, ограничиваем время
      if (selectedDate.toDateString() === now.toDateString()) {
         const currentHour = now.getHours();
         const currentMinute = now.getMinutes();

         if (
            updatedTime.hour < currentHour ||
            (updatedTime.hour === currentHour && updatedTime.minute < currentMinute)
         ) {
            updatedTime = { hour: currentHour, minute: currentMinute };
         }
      }

      ctx.session.currentEvent.selectedTime = updatedTime;

      const keyboard = this.timeService.generateTimeKeyboard(
         updatedTime.hour,
         updatedTime.minute
      );

      try {
         await ctx.editMessageReplyMarkup({ inline_keyboard: keyboard.inline_keyboard });
      } catch (err) {
         console.error("Ошибка при обновлении клавиатуры:", err);
         await ctx.answerCbQuery("Не удалось обновить время. Попробуйте снова.");
      }
   }


   @Action('confirm_time')
   async confirmTime(@Ctx() ctx: Context) {
      const { hour, minute } = ctx.session.currentEvent.selectedTime;
      const timeToString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      await ctx.answerCbQuery(
         `Вы выбрали время: ${timeToString}`
      );
   }

   @Action('cancel_time')
   async cancelTime(@Ctx() ctx: Context) {
      await ctx.reply('Выбор времени отменён.');
   }


   @Action('edit_event_cost')
   async editEventCost(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const msg = await ctx.reply(lang === 'uz' ? 'Янги санани киритинг' : 'Введите новую дату мероприятия:');
      ctx.session.awaitingInput = 'date';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   @Action('edit_event_category')
   async editEventCategory(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const msg = await ctx.reply(lang === 'uz' ? 'Янги санани киритинг' : 'Введите новую дату мероприятия:');
      ctx.session.awaitingInput = 'date';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   @Action('edit_event_phone')
   async editEventPhone(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const msg = await ctx.reply(lang === 'uz' ? 'Янги санани киритинг' : 'Введите новую дату мероприятия:');
      ctx.session.awaitingInput = 'date';
      ctx.session.messageToDelete.push(msg.message_id);
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
         // await this.refreshData(ctx)
      }
   }

   @On('text')
   async handleTextInput(@Ctx() ctx: Context, @Message() message) {
      const lng = ctx.session.language;
      const inputType = ctx.session.awaitingInput;
      ctx.session.messageToDelete.push(message.message_id);

      if (inputType === 'name') {
         ctx.session.currentEvent.name = message.text;
      } else if (inputType === 'description') {
         ctx.session.currentEvent.description = message.text;
      } else if (inputType === 'date') {
         ctx.session.currentEvent.date = message.text;
      } else {
         // await this.clearChat(ctx);
      }
      // await this.refreshEventData(ctx);
   }

   async refreshEventData(ctx: Context) {
      await this.updateEventInfo(ctx);
      await this.clearChat(ctx);
      await this.eventService.updateEvent(ctx.session.currentEvent);
      ctx.session.awaitingInput = null;
   }

   async updateEventInfo(ctx: Context) {
      await this.genEventText(ctx);
      try {
         await ctx.telegram.editMessageMedia(
            ctx.chat.id, ctx.session.messageIdToEdit, undefined,
            {
               type: 'photo',
               media: ctx.session.currentEvent.photo || 'https://via.placeholder.com/300',
               caption: this.eventText,
            },
            {
               reply_markup: {
                  inline_keyboard: eventKeyboard(ctx.session.language),
               },
            }
         );
      } catch (error) {
         console.log('Ошибка обновления мероприятия. Попробуйте перезапустить раздел');
      }
   }

   async clearChat(ctx: Context) {
      if (ctx.session.messageToDelete.length > 0) {
         try {
            await ctx.telegram.deleteMessages(ctx.chat.id, ctx.session.messageToDelete);
         } catch (error) {
            console.error('Error deleting messages', error);
         } finally {
            ctx.session.messageToDelete = [];
         }
      }
   }
}