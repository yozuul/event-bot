import { Injectable } from '@nestjs/common';
import { Command, Ctx, Hears, InjectBot, Message, On, Start, Update, Action } from 'nestjs-telegraf';

import { Context } from './context.interface';
import { BotService } from './bot.service';
import { EventsTextGenerator } from './keyboards';
import { EventsService } from '@app/events/events.service';
import { AdwerstingActions } from './actions';

@Injectable()
@Update()
export class BotUpdate {
   constructor(
      // @InjectBot()
      private readonly botService: BotService,
      private readonly eventsService: EventsService,
      private readonly eventsTextGenerator: EventsTextGenerator,
      private readonly adwerstingActions: AdwerstingActions
   ) {}

   @Start()
   async startCommand(@Ctx() ctx: Context) {
      if(!ctx.session.user || !ctx.session.user.id) {
         await this.botService.resetSession(ctx, 'started')
      }
      await ctx.scene.enter('SETTINGS_SCENE')
   }

   @Action(/publicToBot_(.+)/)
   @Action(/publicToGroup_(.+)/)
   async asyncPublicToFlag(@Ctx() ctx: Context) {
      await this.botService.publicToFlag(ctx)
   }

   @Action(/approve_event_(.+)/)
   @Action(/decline_event_(.+)/)
   @Action(/delete_event_(.+)/)
   async eventOperation(@Ctx() ctx: Context) {
      // console.log(ctx.session)
      const command = ctx.callbackQuery['data'].split('_')[0]
      const eventId = ctx.callbackQuery['data'].split('_')[2]
      if(command === 'delete') {
         await this.eventsService.deleteEvent(eventId)
         await ctx.deleteMessage()
         return
      }
      this.botService.checkCheckboxex(ctx, eventId)
      let event = null
      const checkboxes = ctx.session.checkboxes[eventId]
      if(checkboxes.public_to_bot || checkboxes.public_to_group) {
         event = await this.botService.eventOperation(ctx)
      } else {
         ctx.answerCbQuery('Вы не отметили место для публикации')
         return
      }

      if(ctx.session.checkboxes[eventId].public_to_group) {
         try {
            ctx.session.currentEvent = event
            const msg = await this.sendToGroup(ctx)
            event.groupPostId = msg.message_id
            await event.save()
         } catch (error) {
            console.log('Ошибка сохранения ID поста мероприятия')
         }
      }

      if(command === 'approve') {
         try {
            await ctx.telegram.editMessageReplyMarkup(
               ctx.chat.id, ctx.callbackQuery.message.message_id, undefined, {
                  inline_keyboard: [[{
                     text: '🗑 Удалить',
                     callback_data: `delete_event_${eventId}`
                  }]],
               }
            );
         } catch (error) {
            console.log('Ошибка удаления клавиатуры')
         }
      }
      ctx.answerCbQuery()
   }

   async sendToGroup(@Ctx() ctx: Context) {
      const eventId = ctx.session.currentEvent.id
      const text = await this.eventsTextGenerator.genEventText(ctx, 'НОВОЕ МЕРОПРИЯТИЕ', 'fullText')
      const msg = await ctx.telegram.sendPhoto(process.env.PUBLIC_CHANNEL,
         ctx.session.currentEvent.photo || 'https://via.placeholder.com/300', {
            caption: text,
            parse_mode: 'Markdown'
         },
      )
      return msg
   }

   @Action(/sendAdwPost_(.+)/)
   async forwardMessageToUsers(@Ctx() ctx: Context) {
      await this.adwerstingActions.forwardMessageToUsers(ctx)
   }
   @Action(/deleteAdwPost_(.+)/)
   async deleteAdwPost(@Ctx() ctx: Context) {
      await this.adwerstingActions.deleteAdwPost(ctx)
   }

   @On('message')
   async message(@Ctx() ctx: Context, @Message() message) {
      console.log('MESSAGE')
      console.log(ctx.update)
      if(message?.sender_chat?.id === process.env.PUBLIC_CHANNEL) {
         console.log('bot.update.ts ', message)
      }
   }

   @On('channel_post')
   async channelPost(@Ctx() ctx: Context) {
      if(ctx.update['channel_post']?.sender_chat?.id === parseInt(process.env.ADW_CHANNEL)) {
         await this.adwerstingActions.addAdwControlButton(ctx, ctx.update['channel_post']?.message_id)
      }
      console.log(ctx.update)
   }

   @On('channel_chat_created')
   async sdsd(@Ctx() ctx: Context, @Message() message) {
      // console.log(ctx.session)
      // console.log(ctx.update)
      console.log('channel_chat_created')
   }

   @On('text')
   async handleTextInput(@Ctx() ctx: Context, @Message() message) {
      console.log('handleTextInput')
      await this.botService.checkGlobalCommand(ctx, message.text, 'EVENTS_LIST_SCENE')
      if(ctx.session.messageToDelete) {
         ctx.session.messageToDelete.push(message.message_id);
      }
   }

   @On('callback_query')
   async checkCallback(@Ctx() ctx: Context) {
      await this.botService.checkGlobalActions(ctx, 'WELCOME_SCENE')
   }
}
