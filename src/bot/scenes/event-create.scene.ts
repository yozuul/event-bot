import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action, Command, On, Message, Start } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { BotService } from '../bot.service';
import { EventsKeyboard, EventsTextGenerator } from '../keyboards';
import { EventsService } from '@app/events/events.service';
import { TimeSelectionService } from '../date-services';
import { EventsCreateActions } from '../actions/events-create.action';

@Scene('EVENT_CREATE_SCENE')
@Injectable()
export class EventCreateScene {
   constructor(
      private readonly botService: BotService,
      private readonly eventService: EventsService,
      private readonly timeService: TimeSelectionService,
      private readonly eventsKeyboard: EventsKeyboard,
      private readonly eventsTextGenerator: EventsTextGenerator,
      @Inject(forwardRef(() => EventsCreateActions))
      private readonly eventsCreateActions: EventsCreateActions
   ) {}

   @SceneEnter()
   async onSceneEnter(@Ctx() ctx: Context) {
      await this.botService.sceneEnterCleaner(ctx)
      const addEventMessage = await this.showEventTemplate(ctx);
      if (addEventMessage && 'message_id' in addEventMessage) {
         ctx.session.messageIdToEdit = addEventMessage.message_id;
      }
   }

   async showEventTemplate(@Ctx() ctx: Context) {
      let editButton = false
      let deleteButton = false
      if(ctx.session.query === 'editEvent') {
         editButton = true
         deleteButton = true
      } else if (ctx.session.query === 'showCalendar') {
         const calendar = await this.editEventDate(ctx)
         return calendar
      } else {
         ctx.session.query = null
         ctx.session.currentEvent = {
            eventId: null, title: '', name: '', photo: '', description: '', date: '', cost: '',
            category: '', phone: ctx.session.user.phone, contact: '', status: '',
            selectedYear: null, selectedMonth: null, selectedTime: null, fullDateText: '', fullDate: '',
            dateRawBegin: null, dateRawEnd: null, msgRawEndId: null
         };
      }

      const text = await this.eventsTextGenerator.genEventText(ctx);
      return await ctx.replyWithPhoto(
         ctx.session.currentEvent.photo || 'https://via.placeholder.com/300',
         {
            caption: text,
            reply_markup: {
               inline_keyboard: this.eventsKeyboard.addEditEvent(
                  ctx.session.language, this.canSave(ctx), editButton, deleteButton,
                  ctx.session.user?.admin, false, ctx.session
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
      const text = await this.eventsTextGenerator.genEventText(ctx);
      try {
         await ctx.telegram.editMessageMedia(
            ctx.chat.id, ctx.session.messageIdToEdit, undefined,
            {
               type: 'photo',
               media: ctx.session.currentEvent.photo || 'https://via.placeholder.com/300',
               caption: text,
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

   canEdit(@Ctx() ctx: Context) {
      const currentEvent = ctx.session.currentEvent
      let canSave = false
      if(currentEvent.name && currentEvent.fullDateText && currentEvent.description && currentEvent.phone) {
         canSave = true
      }
      return canSave
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
      await this.eventsCreateActions.editEventName(ctx);
   }
   @Action('edit_event_photo')
   async editPhoto(@Ctx() ctx: Context) {
      await this.eventsCreateActions.editPhoto(ctx);
   }

   @Action('edit_event_description')
   async editEventDescription(@Ctx() ctx: Context) {
      await this.eventsCreateActions.editEventDescription(ctx);
   }

   @Action('edit_event_cost')
   async editEventCost(@Ctx() ctx: Context) {
      await this.eventsCreateActions.editEventCost(ctx);
   }

   @Action('edit_event_category')
   async editEventCategory(@Ctx() ctx: Context) {
      await this.eventsCreateActions.editEventCategory(ctx);
   }

   @Action('edit_event_phone')
   async editEventPhone(@Ctx() ctx: Context) {
      await this.eventsCreateActions.editEventPhone(ctx);
   }

   @Action('edit_organisation_contact')
   async editOrganisationContact(@Ctx() ctx: Context) {
      await this.eventsCreateActions.editOrganisationContact(ctx);
   }

   @Action('edit_event_date')
   async editEventDate(@Ctx() ctx: Context) {
      await this.eventsCreateActions.editEventDate(ctx);
   }

   @Action('edit_event_date_raw')
   async editEventDateRaw(@Ctx() ctx: Context) {
      await this.eventsCreateActions.editEventDateRaw(ctx);
   }

   @Action('confirm_time')
   async confirmTime(@Ctx() ctx: Context) {
      await this.eventsCreateActions.confirmTime(ctx);
   }

   @Action('cancel_time')
   async cancelTime(@Ctx() ctx: Context) {
      await this.eventsCreateActions.cancelTime(ctx);
   }

   @Action('default_callback_time')
   async defaultCallbackTime(@Ctx() ctx: Context) {
      await ctx.answerCbQuery('Для изменения времени, используйте кнопки +/-');
   }

   @Action(/select_category_(.+)/)
   async selectCategory(@Ctx() ctx: Context) {
      await this.eventsCreateActions.selectCategory(ctx);
   }

   @Action(/change_month_(\d+)_(\d+)/)
   async changeMonth(@Ctx() ctx: Context) {
      await this.eventsCreateActions.changeMonth(ctx);
   }

   @Action(/select_day_(\d+)/)
   async selectDay(@Ctx() ctx: Context) {
      await this.eventsCreateActions.selectDay(ctx);
   }

   @Action(/^increment_(hour|minute)$/)
   @Action(/^decrement_(hour|minute)$/)
   async adjustTime(@Ctx() ctx: Context) {
      await this.eventsCreateActions.adjustTime(ctx);
   }

   @Action('save_event')
   async saveEvent(@Ctx() ctx: Context) {
      await this.eventsCreateActions.saveEvent(ctx);
   }

   @Action('update_event')
   async updateEvent(@Ctx() ctx: Context) {
      await this.eventsCreateActions.updateEvent(ctx);
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
      } else if (ctx.session.awaitingInput === 'org_contact') {
         ctx.session.currentEvent.contact = message.text;
         await this.refreshEventData(ctx);
      } else if (ctx.session.awaitingInput === 'date') {
         ctx.session.currentEvent.date = message.text;
         await this.refreshEventData(ctx);
      } else if (ctx.session.awaitingInput === 'date_event') {
         ctx.session.showEventsForDate = message.text;
         await this.refreshEventData(ctx);
      } else if (ctx.session.awaitingInput === 'photo') {
         const msgText = lang === 'uz' ? 'Tadbirning fotosini yuklang' : 'Загрузите фото мероприятия'
         const msg = await ctx.reply(msgText)
         ctx.session.messageToDelete.push(msg.message_id)
      }
   }

   async selectTime(@Ctx() ctx: Context) {
      const { hour, minute } = ctx.session.currentEvent.selectedTime;
      const keyboard = this.timeService.generateTimeKeyboard(hour, minute);
      await ctx.telegram.editMessageText(
         ctx.chat.id, ctx.session.calendarMessageId, undefined, 'Выберите время:',
         { reply_markup: keyboard }
      );
   }

   async sendToGroup(@Ctx() ctx: Context, eventId) {
      const text = await this.eventsTextGenerator.genEventText(
         ctx, 'НОВОЕ МЕРОПРИЯТИЕ НА МОДЕРАЦИИ', 'fullText', 'AddIndiciatorField'
      )
      try {
         await ctx.telegram.sendPhoto(process.env.ADMIN_CHANNEL,
            ctx.session.currentEvent.photo || 'https://via.placeholder.com/300', {
               caption: text,
               reply_markup: {
                  inline_keyboard: this.eventsKeyboard.addEditEvent(
                     ctx.session.language, 'canSave', 'canEdit', 'canDelete', 'isAdmin', eventId, ctx.session
                  ),
               }, parse_mode: 'Markdown'
            },
         );

      } catch (error) {
         console.log(error.description === 'Bad Request: message caption is too long')
      }
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