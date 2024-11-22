import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action, Command, On, Message } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { addEditEventKeyboard, eventCatgoryKeyboard, LanguageKeyboard } from '../keyboards';
import { EventsService } from '@app/events/events.service';
import { CalendarService, TimeSelectionService } from '../date-services';
import { DateSelectionHandler } from './select-date.handlers';

@Scene('EVENT_CREATE_SCENE')
@Injectable()
export class EventCreateScene {
   private eventText: string;
   constructor(
      private readonly eventService: EventsService,
      private readonly calendarService: CalendarService,
      private readonly timeService: TimeSelectionService,
      private readonly languageKeyboard: LanguageKeyboard,
      private readonly monthActionHandler: DateSelectionHandler
   ) {}

   @Command('add_event')
   async allEvents(ctx: Context) {
      console.log('вход в сцену EVENT_CREATE_SCENE')
      await this.deleteDublicate(ctx)
      await this.clearChat(ctx)
      await ctx.scene.enter('EVENT_CREATE_SCENE');
   }
   @Command('profile')
   async profile(ctx: Context) {
      await this.deleteDublicate(ctx)
      await this.clearChat(ctx)
      await ctx.scene.enter('PROFILE_SCENE');
   }
   @Command('events')
   async showAllEvents(ctx: Context) {
      await this.deleteDublicate(ctx)
      await this.clearChat(ctx)
      ctx.session.prevScene = 'EVENT_CREATE_SCENE'
      ctx.session.query = 'showAllEvents'
      await ctx.scene.enter('PROFILE_SCENE');
   }
   @Action('go_back')
   async goBack(ctx: Context) {
      await this.deleteDublicate(ctx)
      await this.clearChat(ctx)
      const prevScene = ctx.session.prevScene
      ctx.session.prevScene = 'EVENT_CREATE_SCENE'
      await ctx.answerCbQuery('Назад');
      await ctx.scene.enter(prevScene);
   }

   @SceneEnter()
   async onSceneEnter(@Ctx() ctx: Context) {
      const lang = ctx.session.language;
      const statusText = {
         notPublish: {
            ru: '⛔️ Не опубликовано', uz: '⛔️ Нашр этилмаган'
         },
         publish :{
            ru: '✅ Опубликовано', uz: '✅ Нашр этилди'
         }
      }
      if(ctx.session.query === 'editEvent') {
         ctx.session.currentEvent.name = ''
      } else {
         ctx.session.currentEvent = {
            id: '', title: '', name: '', photo: '', description: '', date: '', cost: '',
            category: '', phone: ctx.session.user.phone, status: '⛔️ Не опубликовано',
            selectedYear: null, selectedMonth: null, selectedTime: null, fullDate: ''
         };
      }
      const addEventMessage = await this.showEventTemplate(ctx);
      ctx.session.messageIdToEdit = addEventMessage.message_id;
   }

   private async showEventTemplate(@Ctx() ctx: Context) {
      const lng = ctx.session.language || 'ru';
      await this.genEventText(ctx);
      return await ctx.replyWithPhoto(
         ctx.session.currentEvent.photo || 'https://via.placeholder.com/300',
         {
            caption: this.eventText,
            reply_markup: {
               inline_keyboard: addEditEventKeyboard(lng),
            },
         },
      );
   }

   async genEventText(@Ctx() ctx: Context) {
      const lng = ctx.session.language || 'ru';
      const t = (uz: string, ru: string) => (lng === 'uz' ? uz : ru);
      const noData = t('кўрсатилмаган', 'не указано');
      ctx.session.currentEvent.title = t('ТАДБИР ҚЎШИШ', 'ДОБАВЛЕНИЕ МЕРОПРИЯТИЯ');

      const event = ctx.session.currentEvent;
      const fields = [
         { label: t('Номи', 'Название'), value: event.name },
         { label: t('Тавсиф', 'Описание'), value: event.description },
         { label: t('Сана', 'Дата'), value: event.fullDate },
         { label: t('Нархи', 'Стоимость'), value: event.cost },
         { label: t('Категория', 'Категория'), value: event.category },
         { label: t('Телефон', 'Телефон'), value: event.phone },
         { label: t('Ҳолат', 'Статус'), value: event.status },
      ];
      this.eventText = `${ctx.session.currentEvent.title}\n` + fields
         .map(field => `${field.label}: ${field.value || noData}`)
         .join('\n');
   }

   @Action('save_event')
   async saveEvent(@Ctx() ctx: Context) {
      console.log('ddd')
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      await this.clearChat(ctx);
      ctx.answerCbQuery('Мероприятие отправлено на проверку');
      await this.eventService.createEvent(ctx.session.currentEvent);
      ctx.session.prevScene = 'EVENT_CREATE_SCENE'
      ctx.session.query = 'showAllUsersEvents'
      await ctx.scene.enter('EVENTS_LIST_SCENE');
   }

   @Action('edit_event_name')
   async editEventName(@Ctx() ctx: Context) {
      await this.clearChat(ctx);
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const msg = await ctx.reply(lang === 'uz' ? 'Янги номини киритинг' : 'Введите новое название мероприятия:');
      ctx.session.awaitingInput = 'name';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   @Action('edit_event_photo')
   async editPhoto(@Ctx() ctx: Context) {
      await this.clearChat(ctx);
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language
      const msg = await ctx.reply(lang == 'uz' ? 'Янги расмни юборинг' : 'Отправьте новую фотографию:');
      ctx.session.awaitingInput = 'photo';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   @Action('edit_event_description')
   async editEventDescription(@Ctx() ctx: Context) {
      await this.clearChat(ctx);
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const msg = await ctx.reply(lang === 'uz' ? 'Янги тавсифини киритинг' : 'Введите новое описание мероприятия:');
      ctx.session.awaitingInput = 'description';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   @Action('edit_event_cost')
   async editEventCost(@Ctx() ctx: Context) {
      await this.clearChat(ctx);
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const msg = await ctx.reply(lang === 'uz' ? 'Тадбирнинг нархини киритинг:' : 'Введите стоимость мероприятия:');
      ctx.session.awaitingInput = 'cost';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   @Action('edit_event_category')
   async editEventCategory(@Ctx() ctx: Context) {
      await this.clearChat(ctx);
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const msg = await ctx.reply(
         lang === 'uz' ? 'Янги санани киритинг' : 'Введите новую дату мероприятия:',
         eventCatgoryKeyboard
      );
      ctx.session.messageToDelete.push(msg.message_id);
      ctx.session.awaitingInput = 'category';
   }

   @Action('edit_event_phone')
   async editEventPhone(@Ctx() ctx: Context) {
      await this.clearChat(ctx);
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const msg = await ctx.reply(lang === 'uz' ? 'Янги санани киритинг' : 'Введите новую дату мероприятия:');
      ctx.session.messageToDelete.push(msg.message_id);
      ctx.session.awaitingInput = 'phone';
   }

   @Action('edit_event_date')
   async editEventDate(@Ctx() ctx: Context) {
      await this.clearChat(ctx);
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const keyboardText = lang === 'uz' ? 'Янги санани киритинг' : 'Введите новую дату мероприятия:'

      const now = new Date();
      const calendar = this.calendarService.generateCalendar(now.getFullYear(), now.getMonth(), lang);
      const dateKeyboard = await ctx.reply(keyboardText, { reply_markup: calendar });

      ctx.session.messageToDelete.push(dateKeyboard.message_id);
      ctx.session.calendarMessageId = dateKeyboard.message_id

      ctx.session.awaitingInput = 'date';
   }

   @Action('confirm_time')
   async confirmTime(@Ctx() ctx: Context) {
      const { hour, minute } = ctx.session.currentEvent.selectedTime;
      const timeToString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      ctx.session.currentEvent.fullDate += ` в ${timeToString}`
      await this.refreshEventData(ctx);
      await ctx.answerCbQuery(`Вы выбрали время: ${timeToString}`);
   }

   @Action('cancel_time')
   async cancelTime(@Ctx() ctx: Context) {
      await ctx.answerCbQuery('Выбор времени отменён.');
      ctx.session.currentEvent.fullDate = ''
      await this.refreshEventData(ctx);
   }

   @Action('default_callback_time')
   async defaultCallbackTime(@Ctx() ctx: Context) {
      await ctx.answerCbQuery('Для изменения времени, используйте кнопки +/-');
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

      const formattedDate = `${selectedDate.getDate().toString().padStart(2, '0')}.${(
         selectedDate.getMonth() + 1
      )
         .toString()
         .padStart(2, '0')}.${selectedDate.getFullYear()}`;
      ctx.session.currentEvent.fullDate = formattedDate;

      await ctx.answerCbQuery(`Дата выбрана: ${selectedDate.toLocaleDateString()}`);
      // Проверяем, если выбранная дата - сегодня
      const isToday = selectedDate.toDateString() === now.toDateString();
      // Устанавливаем начальное время
      ctx.session.currentEvent.selectedTime = {
         hour: isToday ? now.getHours() : 0,
         minute: isToday ? now.getMinutes() : 0,
      };

      await this.selectTime(ctx);
   }

   async selectTime(@Ctx() ctx: Context) {
      const { hour, minute } = ctx.session.currentEvent.selectedTime;
      const keyboard = this.timeService.generateTimeKeyboard(hour, minute);
      await ctx.telegram.editMessageText(
         ctx.chat.id, ctx.session.calendarMessageId, undefined, 'Выберите время:',
         { reply_markup: keyboard }
       );
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

   @On('photo')
   async handlePhotoInput(@Ctx() ctx: Context, @Message() message) {
      ctx.session.messageToDelete.push(message.message_id);
      if (ctx.session.awaitingInput === 'photo') {
         if (message.photo && message.photo.length > 0) {
            const photoId = message.photo[message.photo.length - 1].file_id;
            ctx.session.currentEvent.photo = photoId
         } else {
            await ctx.reply('Ошибка: не удалось получить фотографию. Попробуйте еще раз.');
         }
         await this.refreshEventData(ctx)
      }
   }

   @On('text')
   async handleTextInput(@Ctx() ctx: Context, @Message() message) {
      const lng = ctx.session.language;
      const inputType = ctx.session.awaitingInput;
      ctx.session.messageToDelete.push(message.message_id);
      const photoText = lng === 'uz' ? 'Тадбирнинг расмини юкланг' : 'Загрузите фото мероприятия'
      if (inputType === 'name') {
         ctx.session.currentEvent.name = message.text;
      } else if (inputType === 'description') {
         ctx.session.currentEvent.description = message.text;
      } else if (inputType === 'cost') {
         ctx.session.currentEvent.cost = message.text;
      } else if (inputType === 'category') {
         ctx.session.currentEvent.category = message.text;
      } else if (inputType === 'phone') {
         ctx.session.currentEvent.phone = message.text;
      } else if (inputType === 'date') {
         ctx.session.currentEvent.date = message.text;
      } else if (inputType === 'photo') {
         const msg = await ctx.reply(photoText)
         ctx.session.messageToDelete.push(msg.message_id)
         return
      } else {
         await this.clearChat(ctx);
      }
      await this.refreshEventData(ctx);
   }

   async refreshEventData(ctx: Context) {
      await this.updateEventInfo(ctx);
      await this.clearChat(ctx);
      await this.eventService.updateEvent(ctx.session.currentEvent);
      ctx.session.awaitingInput = null;
   }

   async updateEventInfo(ctx: Context) {
      const currentEvent = ctx.session.currentEvent
      let canSave = false
      if(currentEvent.name && currentEvent.date && currentEvent.description) {
         canSave = true
      }
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
                  inline_keyboard: addEditEventKeyboard(ctx.session.language, canSave),
               },
            }
         );
      } catch (error) {
         console.log('Ошибка обновления мероприятия. Попробуйте перезапустить раздел');
         console.log(error.response.description)
      }
   }

   async deleteDublicate(@Ctx() ctx: Context) {
      if(ctx.session.messageIdToEdit) {
         try {
            await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.messageIdToEdit);
         } catch (error) {
            console.log('Ошибка удаления сообщения')
            ctx.session.messageIdToEdit = null
         }
      }
      ctx.session.messageIdToEdit = null
   }
   async clearChat(@Ctx() ctx: Context) {
      try {
         if(!ctx.callbackQuery) {
            await ctx.deleteMessage()
         }
      } catch (error) {
         console.log('Ошибка удаления текущего сообщения')
      }
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