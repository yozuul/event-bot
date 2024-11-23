import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action, Command, On, Message } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { BotService } from '../bot.service';
import { eventCatgoryKeyboard, EventsKeyboard } from '../keyboards';
import { EventsService } from '@app/events/events.service';
import { CalendarService, TimeSelectionService } from '../date-services';

@Scene('EVENT_CREATE_SCENE')
@Injectable()
export class EventCreateScene {
   private eventText: string;
   constructor(
      private readonly botService: BotService,
      private readonly eventService: EventsService,
      private readonly calendarService: CalendarService,
      private readonly timeService: TimeSelectionService,
      private readonly eventsKeyboard: EventsKeyboard
   ) {}

   @SceneEnter()
   async onSceneEnter(@Ctx() ctx: Context) {
      await this.botService.sceneEnterCleaner(ctx)
      const addEventMessage = await this.showEventTemplate(ctx);
      ctx.session.messageIdToEdit = addEventMessage.message_id;
   }

   async showEventTemplate(@Ctx() ctx: Context) {
      const lang = ctx.session.language  || 'ru';
      const statusText = {
         notPublish: {
            ru: '⛔️ Не опубликовано', uz: '⛔️ Нашр этилмаган'
         },
         publish :{
            ru: '✅ Опубликовано', uz: '✅ Нашр этилди'
         }
      }
      if(ctx.session.query === 'editEvent') {
         console.log('edit')
      } else {
         ctx.session.currentEvent = {
            eventId: '', title: '', name: '', photo: '', description: '', date: '', cost: '',
            category: '', phone: ctx.session.user.phone, status: statusText.notPublish[lang],
            selectedYear: null, selectedMonth: null, selectedTime: null, fullDateText: '', fullDate: ''
         };
      }
      await this.genEventText(ctx);
      return await ctx.replyWithPhoto(
         ctx.session.currentEvent.photo || 'https://via.placeholder.com/300',
         {
            caption: this.eventText,
            reply_markup: {
               inline_keyboard: this.eventsKeyboard.addEditEvent(lang),
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
         { label: t('Сана', 'Дата'), value: event.fullDateText },
         { label: t('Нархи', 'Стоимость'), value: event.cost },
         { label: t('Категория', 'Категория'), value: event.category },
         { label: t('Телефон', 'Телефон'), value: event.phone },
         { label: t('Ҳолат', 'Статус'), value: event.status },
      ];
      this.eventText = `${ctx.session.currentEvent.title}\n` + fields
         .map(field => `${field.label}: ${field.value || noData}`)
         .join('\n');
      return this.eventText
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
                  inline_keyboard: this.eventsKeyboard.addEditEvent(ctx.session.language, canSave),
               },
            }
         );
      } catch (error) {
         console.log('Ошибка обновления мероприятия. Попробуйте перезапустить раздел');
         console.log(error.response.description)
      }
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

   @Action('edit_event_cost')
   async editEventCost(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const msg = await ctx.reply(lang === 'uz' ? 'Тадбирнинг нархини киритинг:' : 'Введите стоимость мероприятия:');
      ctx.session.awaitingInput = 'cost';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   @Action('edit_event_category')
   async editEventCategory(@Ctx() ctx: Context) {
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
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const msg = await ctx.reply(lang === 'uz' ? 'Янги санани киритинг' : 'Введите новую дату мероприятия:');
      ctx.session.messageToDelete.push(msg.message_id);
      ctx.session.awaitingInput = 'phone';
   }

   @Action('edit_event_date')
   async editEventDate(@Ctx() ctx: Context) {
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
      ctx.session.currentEvent.fullDateText += ` в ${timeToString}`
      const event = ctx.session.currentEvent
      const originalDate = new Date(event.date);
      originalDate.setHours(event.selectedTime.hour, event.selectedTime.minute, 0, 0);
      ctx.session.currentEvent.fullDate = originalDate.toISOString();
      ctx.session.currentEvent.fullDateText += ` в ${timeToString}`
      await this.refreshEventData(ctx);
      await ctx.answerCbQuery(`Вы выбрали время: ${timeToString}`);
   }

   @Action('cancel_time')
   async cancelTime(@Ctx() ctx: Context) {
      await ctx.answerCbQuery('Выбор времени отменён.');
      ctx.session.currentEvent.fullDateText = ''
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
      ctx.session.currentEvent.selectedYear = year
      ctx.session.currentEvent.selectedMonth = month
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
      ctx.session.currentEvent.fullDateText = formattedDate;

      await ctx.answerCbQuery(`Дата выбрана: ${selectedDate.toLocaleDateString()}`);
      // Проверяем, если выбранная дата - сегодня
      const isToday = selectedDate.toDateString() === now.toDateString();
      // Устанавливаем начальное время
      ctx.session.currentEvent.selectedTime = {
         hour: isToday ? now.getHours() : 0,
         minute: isToday ? now.getMinutes() : 0,
      };

      ctx.session.currentEvent.selectedYear = year
      ctx.session.currentEvent.selectedMonth = month

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
      await this.botService.checkGlobalCommand(ctx, message.text, 'PROFILE_SCENE')
      ctx.session.messageToDelete.push(message.message_id);
      const lang = ctx.session.language;
      if (ctx.session.awaitingInput === 'name') {
         ctx.session.currentEvent.name = message.text;
         await this.refreshEventData(ctx);
      } else if (ctx.session.awaitingInput === 'description') {
         ctx.session.currentEvent.description = message.text;
         await this.refreshEventData(ctx);
      } else if (ctx.session.awaitingInput === 'cost') {
         ctx.session.currentEvent.cost = message.text;
         await this.refreshEventData(ctx);
      } else if (ctx.session.awaitingInput === 'category') {
         ctx.session.currentEvent.category = message.text;
         await this.refreshEventData(ctx);
      } else if (ctx.session.awaitingInput === 'phone') {
         ctx.session.currentEvent.phone = message.text;
         await this.refreshEventData(ctx);
      } else if (ctx.session.awaitingInput === 'date') {
         ctx.session.currentEvent.date = message.text;
         await this.refreshEventData(ctx);
      } else if (ctx.session.awaitingInput === 'photo') {
         const msgText = lang === 'uz' ? 'Тадбирнинг расмини юкланг' : 'Загрузите фото мероприятия'
         const msg = await ctx.reply(msgText)
         ctx.session.messageToDelete.push(msg.message_id)
      }
   }


   @Action('go_back')
   async goBack(ctx: Context) {
      const prevScene = ctx.session.prevScene
      ctx.session.prevScene = 'EVENT_CREATE_SCENE'
      await ctx.answerCbQuery('Назад');
      await ctx.scene.enter(prevScene);
   }

   @Action('save_event')
   async saveEvent(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      ctx.answerCbQuery('Мероприятие отправлено на проверку');
      console.log(ctx.session.currentEvent)
      await this.eventService.createEvent(ctx.session.currentEvent, ctx.from.id);
      ctx.session.prevScene = 'EVENT_CREATE_SCENE'
      ctx.session.query = 'showAllUsersEvents'
      await ctx.scene.enter('EVENTS_LIST_SCENE');
   }

   async refreshEventData(ctx: Context) {
      await this.updateEventInfo(ctx);
      await this.botService.clearChat(ctx)
      await this.eventService.updateEvent(ctx.session.currentEvent);
      ctx.session.awaitingInput = null;
   }

   @On('callback_query')
   async checkCallback(@Ctx() ctx: Context) {
      await ctx.deleteMessage()
      await ctx.answerCbQuery('Сообщение устарело');
      console.log('Удаление сообщения из EVENT_CREATE_SCENE')
   }
}