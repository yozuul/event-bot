import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Ctx } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { categoryKeyboard } from '../keyboards';
import { CalendarService, TimeSelectionService } from '../date-services';
import { CategoryService } from '@app/category/category.service';
import { EventCreateScene } from '../scenes';
import { EventsService } from '@app/events/events.service';

@Injectable()
export class EventsCreateActions {
   constructor(
      private readonly eventService: EventsService,
      private readonly calendarService: CalendarService,
      private readonly categoryService: CategoryService,
      private readonly timeService: TimeSelectionService,
      @Inject(forwardRef(() => EventCreateScene))
      private readonly eventCreateScene: EventCreateScene
   ) {}

   async editEventName(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const msg = await ctx.reply(lang === 'uz' ? 'Yangi tadbir nomini kiriting:' : 'Введите новое название мероприятия:');
      ctx.session.awaitingInput = 'name';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   async editPhoto(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language
      const msg = await ctx.reply(lang == 'uz' ? 'Yangi rasmni yuboring:' : 'Отправьте новую фотографию:');
      ctx.session.awaitingInput = 'photo';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   async editEventDescription(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const msg = await ctx.reply(lang === 'uz' ? 'Tadbirning yangi tavsifini kiriting:' : 'Введите новое описание мероприятия:');
      ctx.session.awaitingInput = 'description';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   async editEventCost(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const msg = await ctx.reply(lang === 'uz' ? 'Tadbir narxini kiriting:' : 'Введите стоимость мероприятия:');
      ctx.session.awaitingInput = 'cost';
      ctx.session.messageToDelete.push(msg.message_id);
   }

   async editEventCategory(@Ctx() ctx: Context) {
      console.log('edit_event_category')
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const existCategory = await this.categoryService.findAll();
      const msg = await ctx.reply(lang === 'uz' ? 'Kategoriya tanlang:' : 'Выберите категорию:', {
         reply_markup: {
            inline_keyboard: categoryKeyboard(lang, existCategory, false, 'noCommonButton'),
         },
      });
      ctx.session.messageToDelete.push(msg.message_id);
      ctx.session.awaitingInput = 'category';
   }

   async editEventPhone(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const msg = await ctx.reply(
         lang === 'uz' ? 'Kontakt telefonini kiriting:' : 'Укажите контактный телефон:'
      );
      ctx.session.messageToDelete.push(msg.message_id);
      ctx.session.awaitingInput = 'phone';
   }

   async editOrganisationContact(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const msg = await ctx.reply(
         lang === 'uz' ? 'Aloqani @nickname formatida kiriting:' : 'Укажите контакт в формате @nicname'
      );
      ctx.session.messageToDelete.push(msg.message_id);
      ctx.session.awaitingInput = 'org_contact';
   }

   async editEventDate(@Ctx() ctx: Context) {

      ctx.session.currentEvent.selectedYear = new Date().getFullYear();
      ctx.session.currentEvent.selectedMonth = new Date().getMonth();

      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;

      const lang = ctx.session.language;
      const keyboardText = lang === 'uz' ? 'Tadbir sanasini kiriting:' : 'Укажите дату мероприятия:'

      const now = new Date();
      const calendar = this.calendarService.generateCalendar(now.getFullYear(), now.getMonth(), lang);
      const dateKeyboard = await ctx.reply(keyboardText, { reply_markup: calendar });

      ctx.session.messageToDelete.push(dateKeyboard.message_id);
      ctx.session.calendarMessageId = dateKeyboard.message_id

      if(ctx.session.query === 'showCalendar') {
         ctx.session.awaitingInput = 'date_event';
         return dateKeyboard
      } else {
         ctx.session.awaitingInput = 'date';
      }
   }

   async editEventDateRaw(@Ctx() ctx: Context) {

      ctx.session.currentEvent.selectedYear = new Date().getFullYear();
      ctx.session.currentEvent.selectedMonth = new Date().getMonth();

      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;

      const lang = ctx.session.language;
      const keyboardText = lang === 'uz' ? 'Tadbir boshlanish sanasini kiriting:' : 'Укажите дату начала мероприятия:'

      const now = new Date();
      const calendar = this.calendarService.generateCalendar(now.getFullYear(), now.getMonth(), lang);
      const dateKeyboard = await ctx.reply(keyboardText, { reply_markup: calendar });

      ctx.session.messageToDelete.push(dateKeyboard.message_id);
      ctx.session.calendarMessageId = dateKeyboard.message_id

      if(!ctx.session.awaitingInput) {
         ctx.session.awaitingInput = 'date_event_begin'
      }
   }

   async confirmTime(@Ctx() ctx: Context) {
      const { hour, minute } = ctx.session.currentEvent.selectedTime;

      const parseTime = (what: number) => what.toString().padStart(2, '0')
      const timeToString = `${parseTime(hour)}:${parseTime(minute)}`

      if(ctx.session.currentEvent.date) {
         const originalDate = new Date(ctx.session.currentEvent.date);
         originalDate.setHours(
            ctx.session.currentEvent.selectedTime.hour, ctx.session.currentEvent.selectedTime.minute, 0, 0
         );
         ctx.session.currentEvent.fullDateText += ` в ${timeToString}`
         await this.eventCreateScene.refreshEventData(ctx)
         await ctx.answerCbQuery(`Вы выбрали время: ${timeToString}`);
      }
      if(ctx.session.currentEvent.dateRawBegin) {
         const originalDateBegin = new Date(ctx.session.currentEvent.dateRawBegin);
         originalDateBegin.setHours(
            ctx.session.currentEvent.selectedTime.hour, ctx.session.currentEvent.selectedTime.minute, 0, 0
         );
         ctx.session.currentEvent.fullDateText += ` в ${timeToString}`
         await this.eventCreateScene.refreshEventData(ctx)
         await ctx.answerCbQuery(`Вы выбрали время: ${timeToString}`);
      }
      console.log(ctx.session.currentEvent)
   }

   async cancelTime(@Ctx() ctx: Context) {
      await ctx.answerCbQuery('Выбор времени отменён.');
      ctx.session.currentEvent.fullDateText = ''
      await this.eventCreateScene.refreshEventData(ctx)
   }

   async selectCategory(@Ctx() ctx: Context) {
      if ('data' in ctx.callbackQuery && ctx.callbackQuery.data) {
         const selectedCategoryId = ctx.callbackQuery.data.split('_')[2]
         const categoryData = await this.categoryService.findById(selectedCategoryId)
         ctx.session.currentEvent.category = categoryData[ctx.session.language]
         ctx.session.currentEvent.categoryId = categoryData.id
      }
      await this.eventCreateScene.refreshEventData(ctx)
   }

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

   async selectDay(@Ctx() ctx: Context) {
      let match = null;
      if ('data' in ctx.callbackQuery && ctx.callbackQuery.data) {
         match = ctx.callbackQuery.data.match(/select_day_(\d+)/);
      }
      const day = parseInt(match[1], 10);

      const year = ctx.session.currentEvent.selectedYear;
      const month = ctx.session.currentEvent.selectedMonth;

      // Проверяем корректность данных
      if (month < 0 || month > 11 || isNaN(year)) {
         await ctx.answerCbQuery('Ошибка: некорректный месяц или год');
         return;
      }
      // Создаём дату
      const selectedDate = new Date(year, month, day);
      // Обновляем время
      const now = new Date();
      const isToday = selectedDate.toDateString() === now.toDateString();
      ctx.session.currentEvent.selectedTime = {
         hour: isToday ? now.getHours() : 12,
         minute: isToday ? now.getMinutes() : 0,
      };

      if (ctx.session.awaitingInput === 'date') {
         // Начало дня
         const startOfDay = new Date(selectedDate);
         startOfDay.setUTCHours(0, 0, 0, 0);
         // Конец дня
         const endOfDay = new Date(selectedDate);
         endOfDay.setUTCHours(23, 59, 59, 999);

         ctx.session.currentEvent.dateRawBegin = startOfDay.toISOString();
         ctx.session.currentEvent.dateRawEnd = endOfDay.toISOString();
         // Форматируем дату
         const formattedDate = `${selectedDate.getDate().toString().padStart(2, '0')}.${(
            selectedDate.getMonth() + 1
         )
            .toString()
            .padStart(2, '0')}.${selectedDate.getFullYear()}`;
         ctx.session.currentEvent.fullDateText = formattedDate;

         await ctx.answerCbQuery(`Дата выбрана: ${formattedDate}`);
         await this.eventCreateScene.selectTime(ctx);
      }

      if (ctx.session.awaitingInput === 'date_event_begin') {
         ctx.session.currentEvent.dateRawBegin = selectedDate.toISOString();
         ctx.session.awaitingInput = 'date_event_end'; // Устанавливаем статус для конца диапазона
         const msg = await ctx.reply('Укажите дату окончания мероприятия');
         ctx.session.currentEvent.msgRawEndId = msg.message_id
      } else if (ctx.session.awaitingInput === 'date_event_end') {
         ctx.session.currentEvent.dateRawEnd = selectedDate.toISOString();

         let startDate = new Date(ctx.session.currentEvent.dateRawBegin);
         let endDate = new Date(ctx.session.currentEvent.dateRawEnd);

         if (startDate > endDate) {
            const temp = startDate;
            startDate = endDate;
            endDate = temp;
            // Перезаписываем значения в `ctx.session.currentEvent`
            ctx.session.currentEvent.dateRawBegin = startDate.toISOString();
            ctx.session.currentEvent.dateRawEnd = endDate.toISOString();
         }

//          if(startDate > endDate) {
//             try {
//                await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.currentEvent.msgRawEndId);
//             } catch (error) {
//
//             }
//             await ctx.answerCbQuery(`Дата начала не может быть меньше даты конца. Попробуйте ещё раз`);
//             ctx.session.awaitingInput = 'date_event_begin'
//             ctx.session.currentEvent.dateRawBegin = null
//             ctx.session.currentEvent.dateRawEnd = null
//             return
//          }

         const startFormattedDate = `${startDate.getDate().toString().padStart(2, '0')}.${(
            startDate.getMonth() + 1
         ).toString().padStart(2, '0')}.${startDate.getFullYear()}`;

         const endFormattedDate = `${endDate.getDate().toString().padStart(2, '0')}.${(
            endDate.getMonth() + 1
         ).toString().padStart(2, '0')}.${endDate.getFullYear()}`;

         // Собираем итоговую строку
         ctx.session.currentEvent.fullDateText = `${startFormattedDate} - ${endFormattedDate}`;
         ctx.session.awaitingInput = 'dateRawSelectDone'; // Сбрасываем состояние
         try {
            await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.currentEvent.msgRawEndId);
         } catch (error) {

         }
         await ctx.answerCbQuery(`Дата выбрана: ${ctx.session.currentEvent.fullDateText}`);
         await this.eventCreateScene.selectTime(ctx);
      }

      // Гарантируем, что `selectedMonth` не сбросился
      ctx.session.currentEvent.selectedYear = selectedDate.getFullYear();
      ctx.session.currentEvent.selectedMonth = selectedDate.getMonth();

      // Переход к сцене
      if (ctx.session.query === 'showCalendar') {
         ctx.session.query = 'showEventsForDate';
         ctx.session.showEventsForDate = selectedDate.toLocaleDateString();
         await ctx.scene.enter('EVENTS_LIST_SCENE');
      }
   }

   async adjustTime(@Ctx() ctx: Context) {
      const now = new Date();
      const selectedDate = new Date(ctx.session.currentEvent.date);
      const { hour, minute } = ctx.session.currentEvent.selectedTime;
      let action
      if ('data' in ctx.callbackQuery && ctx.callbackQuery.data) {
         action = ctx.callbackQuery?.data;
      }
      let updatedTime = this.timeService.adjustTime(hour, minute, action, ctx);
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
         await ctx.answerCbQuery("Нельзя выбрать время меньше текущего");
      }
   }

   async saveEvent(@Ctx() ctx: Context) {
      const isCountCharsGood = this.calcCharacters(ctx)
      if(!isCountCharsGood) return
      ctx.answerCbQuery('Мероприятие отправлено на проверку');
      const newEvent = await this.eventService.createEvent(ctx.session.currentEvent, ctx.from.id);
      ctx.session.prevScene = 'EVENT_CREATE_SCENE'
      ctx.session.query = 'showAllUsersEvents'
      await this.eventCreateScene.sendToGroup(ctx, newEvent.id)
      await ctx.scene.enter('EVENTS_LIST_SCENE');
   }

   async updateEvent(@Ctx() ctx: Context) {
      const isCountCharsGood = this.calcCharacters(ctx)
      if(!isCountCharsGood) return
      await this.eventService.updateEvent(ctx.session.currentEvent)
      ctx.answerCbQuery('Мероприятие сохранено');
   }

   calcCharacters(@Ctx() ctx: Context) {
      const { name, description, fullDateText, cost, category, phone, contact } = ctx.session.currentEvent
      const calcCharsCount = name + description + fullDateText + cost + category + phone + contact
      const calc = calcCharsCount.length - 1024
      if (calc > 0) {
         ctx.answerCbQuery(`Описание слишком длинное. \nПожалуйста, сократите на ${calc} знаков`);
         return false
      }
      return true
   }
}

