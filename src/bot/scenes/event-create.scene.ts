import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action, Command, On, Message, Start } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { BotService } from '../bot.service';
import { categoryKeyboard, EventsKeyboard } from '../keyboards';
import { EventsService } from '@app/events/events.service';
import { CalendarService, TimeSelectionService } from '../date-services';
import { CategoryService } from '@app/category/category.service';
import { UsersService } from '@app/users/users.service';

@Scene('EVENT_CREATE_SCENE')
@Injectable()
export class EventCreateScene {
   private eventText: string;
   constructor(
      private readonly botService: BotService,
      private readonly userService: UsersService,
      private readonly eventService: EventsService,
      private readonly calendarService: CalendarService,
      private readonly timeService: TimeSelectionService,
      private readonly eventsKeyboard: EventsKeyboard,
      private readonly categoryService: CategoryService
   ) {}

   @SceneEnter()
   async onSceneEnter(@Ctx() ctx: Context) {
      if(!ctx.session.checkboxes) {
         ctx.session.checkboxes = {
            public_to_group: true,
            public_to_bot: true
         }
      }
      await this.botService.sceneEnterCleaner(ctx)
      const addEventMessage = await this.showEventTemplate(ctx);
      ctx.session.messageIdToEdit = addEventMessage.message_id;
   }

   async showEventTemplate(@Ctx() ctx: Context) {
      let editButton = false
      let deleteButton = false
      if(ctx.session.query === 'editEvent') {
         editButton = true
         deleteButton = true
      } else {
         ctx.session.query = null
         ctx.session.currentEvent = {
            eventId: null, title: '', name: '', photo: '', description: '', date: '', cost: '',
            category: '', phone: ctx.session.user.phone, status: '',
            selectedYear: null, selectedMonth: null, selectedTime: null, fullDateText: '', fullDate: ''
         };
      }
      await this.genEventText(ctx);
      return await ctx.replyWithPhoto(
         ctx.session.currentEvent.photo || 'https://via.placeholder.com/300',
         {
            caption: this.eventText,
            reply_markup: {
               inline_keyboard: this.eventsKeyboard.addEditEvent(
                  ctx.session.language, this.canSave(ctx), editButton, deleteButton,
                  ctx.session.user.admin, false, ctx.session
               ),
            },
            parse_mode: 'Markdown'
         },
      );
   }


   async updateEventInfo(ctx: Context) {
      let editButton = false
      let deleteButton = false
      if(ctx.session.query === 'editEvent') {
         editButton = true
         deleteButton = true
      }
      await this.genEventText(ctx);
      try {
         await ctx.telegram.editMessageMedia(
            ctx.chat.id, ctx.session.messageIdToEdit, undefined,
            {
               type: 'photo',
               media: ctx.session.currentEvent.photo || 'https://via.placeholder.com/300',
               caption: this.eventText,
               parse_mode: 'Markdown'
            },
            {
               reply_markup: {
                  inline_keyboard: this.eventsKeyboard.addEditEvent(
                     ctx.session.language, this.canSave(ctx), editButton, deleteButton,
                     false, false, ctx.session
                  ),
               },
            }
         );
      } catch (error) {
         console.log('Ошибка обновления мероприятия. Попробуйте перезапустить раздел');
         console.log(error.response)
      }
   }


   async genEventText(@Ctx() ctx: Context, title?) {
      const lang = ctx.session.language || 'ru';
      const t = (uz: string, ru: string) => (lang === 'uz' ? uz : ru);
      const noData = t('кўрсатилмаган', 'не указано');
      const statusText = {
         notPublished: t('👁‍🗨 Текширувда', '👁‍🗨 На проверке'),
         published: t('✅ Нашр этилди', '✅ Опубликовано'),
         decline: t('⛔️ Рад этилди', '⛔️ Отклонено'),
      }
      const event = ctx.session.currentEvent;

      if(ctx.session.query === 'addEvent' || !ctx.session.query) {
         ctx.session.currentEvent.title = t('ТАДБИР ҚЎШИШ', 'ДОБАВЛЕНИЕ МЕРОПРИЯТИЯ');
      }
      if(ctx.session.query === 'editEvent') {
         ctx.session.currentEvent.title = t('ТАДБИРНИ ТАҲРИРЛАШ', 'РЕДАКТИРОВАНИЕ МЕРОПРИЯТИЯ');
      }
      if(!event.published) {
         ctx.session.currentEvent.status = statusText.notPublished
      }
      if(event.published) {
         ctx.session.currentEvent.status = statusText.published
      }
      if(event.decline) {
         ctx.session.currentEvent.status = statusText.decline
      }
      if(event.categoryId) {
         const category = await this.categoryService.findById(event.categoryId)
         event.category = category[lang]
      }
      let creator = ctx.session.user
      if(ctx.session.currentEvent.userId) {
         creator = await this.userService.findById(ctx.session.currentEvent.userId)
      }
      title ? ctx.session.currentEvent.title = title : ''
      const creatorFieldText = `[${creator.name || creator.tgId}](tg://user?id=${creator.tgId})`
      const fields = [
         { label: t('Номи', 'Название'), value: event.name },
         { label: t('Тавсиф', 'Описание'), value: event.description },
         { label: t('Сана', 'Дата'), value: event.fullDateText },
         { label: t('Нархи', 'Стоимость'), value: event.cost },
         { label: t('Категория', 'Категория'), value: event.category || noData },
         { label: t('Ташкилотчи', 'Инициатор'), value:  creatorFieldText },
         { label: t('Телефон', 'Телефон'), value: event.phone },
      ];

      if((ctx.session.query == 'showAllUsersEvents' ||
         ctx.session.user?.admin ||
         ctx.session.currentEvent.userId === ctx.session.user?.id) &&
         ctx.session.currentEvent.eventId
      ) {
         fields.push({ label: t('Ҳолат', 'Статус'), value: event.status })
      }
      this.eventText = `${ctx.session.currentEvent.title}\n` + fields
         .map(field => `${field.label}: ${field.value || noData}`)
         .join('\n');
      return this.eventText
   }

   canSave(@Ctx() ctx: Context) {
      const currentEvent = ctx.session.currentEvent
      let canSave = false
      if(currentEvent.name && currentEvent.fullDateText && currentEvent.description && currentEvent.phone) {
         canSave = true
      }
      return canSave
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
      console.log('edit_event_category')
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const existCategory = await this.categoryService.findAll();
      const msg = await ctx.reply(lang === 'uz' ? 'Категорияни танланг:' : 'Выберите категорию:', {
         reply_markup: {
            inline_keyboard: categoryKeyboard(lang, existCategory, false),
         },
      });
      ctx.session.messageToDelete.push(msg.message_id);
      ctx.session.awaitingInput = 'category';
   }

   @Action('edit_event_phone')
   async editEventPhone(@Ctx() ctx: Context) {
      ctx.session.messageIdToEdit = ctx.callbackQuery.message.message_id;
      const lang = ctx.session.language;
      const msg = await ctx.reply(
         lang === 'uz' ? 'Алоқа телефон рақамини кўрсатинг:' : 'Укажите контактный телефон:'
      );
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

      const parseTime = (what: number) => what.toString().padStart(2, '0')
      const timeToString = `${parseTime(hour)}:${parseTime(minute)}`

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

   @Action(/select_category_(.+)/)
   async selectCategory(@Ctx() ctx: Context) {
      if ('data' in ctx.callbackQuery && ctx.callbackQuery.data) {
         const selectedCategoryId = ctx.callbackQuery.data.split('_')[2]
         const categoryData = await this.categoryService.findById(selectedCategoryId)
         ctx.session.currentEvent.category = categoryData[ctx.session.language]
         ctx.session.currentEvent.categoryId = categoryData.id
      }
      await this.refreshEventData(ctx);
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
         hour: isToday ? now.getHours() : 12,
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
      await this.botService.checkGlobalCommand(ctx, message.text, 'EVENT_CREATE_SCENE')
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

   @Action('save_event')
   async saveEvent(@Ctx() ctx: Context) {
      ctx.answerCbQuery('Мероприятие отправлено на проверку');
      console.log(ctx.session.currentEvent)
      const newEvent = await this.eventService.createEvent(ctx.session.currentEvent, ctx.from.id);
      ctx.session.prevScene = 'EVENT_CREATE_SCENE'
      ctx.session.query = 'showAllUsersEvents'
      await this.sendToGroup(ctx, newEvent.id)
      await ctx.scene.enter('EVENTS_LIST_SCENE');
   }

   @Action('update_event')
   async updateEvent(@Ctx() ctx: Context) {
      ctx.answerCbQuery('Мероприятие сохранено');
      await this.eventService.updateEvent(ctx.session.currentEvent);
      ctx.session.prevScene = 'EVENT_CREATE_SCENE'
      ctx.session.query = 'showAllUsersEvents'
      await ctx.scene.enter('EVENTS_LIST_SCENE');
   }

   // @Action('test')
   async sendToGroup(@Ctx() ctx: Context, eventId) {
      console.log(eventId)
      await this.genEventText(ctx, 'НОВОЕ МЕРОПРИЯТИЕ НА МОДЕРАЦИИ')
      await ctx.telegram.sendPhoto(process.env.ADMIN_CHANNEL,
         ctx.session.currentEvent.photo || 'https://via.placeholder.com/300', {
            caption: this.eventText,
            reply_markup: {
               inline_keyboard: this.eventsKeyboard.addEditEvent(
                  ctx.session.language, 'canSave', 'canEdit', 'canDelete', 'isAdmin', eventId, ctx.session
               ),
            }, parse_mode: 'Markdown'
         },
      );
   }

   async refreshEventData(ctx: Context) {
      await this.updateEventInfo(ctx);
      await this.botService.clearChat(ctx)
      if(this.canSave(ctx)) {
         await this.eventService.updateEvent(ctx.session.currentEvent);
      }
      ctx.session.awaitingInput = null;
   }

   @On('callback_query')
   async checkCallback(@Ctx() ctx: Context) {
      await this.botService.checkGlobalActions(ctx, 'EVENT_CREATE_SCENE')
   }
}