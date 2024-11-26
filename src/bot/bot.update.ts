import { Injectable } from '@nestjs/common';
import { Command, Ctx, Hears, InjectBot, Message, On, Start, Update, Action } from 'nestjs-telegraf';
import { Telegraf, Markup } from 'telegraf';

import { Context } from './context.interface';
import { BotService } from './bot.service';
import { EventsKeyboard } from './keyboards';
import { EventsService } from '@app/events/events.service';
import { UsersService } from '@app/users/users.service';
import { EventCreateScene } from './scenes';

@Injectable()
@Update()
export class BotUpdate {
   constructor(
      @InjectBot()
         private readonly bot: Telegraf<Context>,
         private readonly botService: BotService,
         private readonly eventsService: EventsService,
         private readonly userService: UsersService,
         private readonly eventsScene: EventCreateScene,
         private readonly eventsKeyboard: EventsKeyboard,
   ) {}

   @Start()
   async startCommand(@Ctx() ctx: Context) {
      if(!ctx.session.user || !ctx.session.user.id) {
         await this.botService.resetSession(ctx)
      }
      try {
         await ctx.deleteMessage()
      } catch (error) {
         console.log('Ошибка удаления стартового сообщения')
      }
      // if(ctx.startPayload) {
      //    ctx.session.query = 'editEvent'
      //    ctx.session.currentEvent = await this.eventsService.findById(ctx.startPayload)
      //    await ctx.scene.enter('EVENT_CREATE_SCENE')
      // }
      await ctx.scene.enter('SETTINGS_SCENE')
   }

   @Action(/publicToBot_(.+)/)
   @Action(/publicToGroup_(.+)/)
   async asyncPublicToGroupFlag(@Ctx() ctx: Context) {
      ctx.session.checkboxes = ctx.session.checkboxes || { public_to_group: true, public_to_bot: true };
      let command
      let eventId
      if('data' in ctx.callbackQuery) {
         command = ctx.callbackQuery.data.split('_')[0]
         eventId = ctx.callbackQuery.data.split('_')[1]
         if(command == 'publicToBot') {
            ctx.session.checkboxes.public_to_bot = !ctx.session.checkboxes.public_to_bot;
         }
         if(command == 'publicToGroup') {
            ctx.session.checkboxes.public_to_group = !ctx.session.checkboxes.public_to_group;
         }
      }
      const updatedKeyboard = this.eventsKeyboard.addEditEvent(
         ctx.session.language, 'canSave', 'canEdit', 'canDelete', 'isAdmin', eventId, ctx.session
      );
      await ctx.telegram.editMessageReplyMarkup(ctx.chat.id, ctx.callbackQuery.message.message_id, null, {
         inline_keyboard: updatedKeyboard,
      });
      await ctx.answerCbQuery();
   }

   @Action(/approve_event_(.+)/)
   @Action(/decline_event_(.+)/)
   @Action(/delete_event_(.+)/)
   async eventOperation(@Ctx() ctx: Context) {
      let command
      let eventId
      let messageToUser
      if('data' in ctx.callbackQuery) {
         console.log(ctx.callbackQuery.data)
         command = ctx.callbackQuery.data.split('_')[0]
         eventId = ctx.callbackQuery.data.split('_')[2]
      }
      const event = await this.eventsService.findByIdAndSave(eventId)
      const user = await this.userService.findById(event.userId)
      console.log(command)
      console.log(eventId)
      if(ctx.session.checkboxes.public_to_group) {
         ctx.session.currentEvent = event
         await this.sendToGroup(ctx)
      }
      if(ctx.session.checkboxes.public_to_bot) {
         event.published = true
         await event.save()
      }
      if(command === 'approve') {
         messageToUser = '✅ Ваше мероприятие одобрено и размещено'
      }
      if(command === 'decline') {
         messageToUser = '⛔️ Ваше мероприятие было отклонено'
      }
      await ctx.telegram.sendMessage(user.tgId, messageToUser)
      await ctx.answerCbQuery();
   }

   async sendToGroup(@Ctx() ctx: Context) {
      const text = await this.eventsScene.genEventText(ctx, 'НОВОЕ МЕРОПРИЯТИЕ')
      await ctx.telegram.sendPhoto(process.env.PUBLIC_CHANNEL,
         ctx.session.currentEvent.photo || 'https://via.placeholder.com/300', {
            caption: text,
            parse_mode: 'Markdown'
         },
      )
   }

   @Action(/edit_event_(.+)/)
   async editEvent(@Ctx() ctx: Context) {
      await ctx.answerCbQuery('Редактирование');
      console.log(ctx.session)
   }

   @On('channel_post')
   async sdsd(@Ctx() ctx: Context, @Message() message) {
      console.log('CHANNEL_POST')
   }

   @On('text')
   async handleTextInput(@Ctx() ctx: Context, @Message() message) {
      console.log('ddd')
      await this.botService.checkGlobalCommand(ctx, message.text, 'EVENTS_LIST_SCENE')
      ctx.session.messageToDelete.push(message.message_id);
   }

   @On('callback_query')
   async checkCallback(@Ctx() ctx: Context) {
      await this.botService.checkGlobalActions(ctx, 'WELCOME_SCENE')
   }
}
