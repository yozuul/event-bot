import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Ctx, Action, Command, On, Message } from 'nestjs-telegraf';

import { Context } from '../context.interface';
import { EventsKeyboard } from '../keyboards';
import { UsersService } from '@app/users/users.service';
import { BotService } from '../bot.service';
import { EventsService } from '@app/events/events.service';
import { EventCreateScene } from './event-create.scene';

@Scene('EVENTS_LIST_SCENE')
@Injectable()
export class EventsScene {
   constructor(
      private readonly botService: BotService,
      private readonly userService: UsersService,
      private readonly eventsService: EventsService,
      private readonly eventCreateScene: EventCreateScene,
      private readonly eventsKeyboard: EventsKeyboard
   ) {}

   @SceneEnter()
   async onSceneEnter(@Ctx() ctx: Context) {
      await this.botService.sceneEnterCleaner(ctx)
      await this.checkEvents(ctx)
   }

   async checkEvents(@Ctx() ctx: Context) {
      const lang = ctx.session.language
      if(!ctx.session.query || ctx.session.query === 'showAllEvents') {
         const data = await this.eventsService.findClosestUpcomingEvent()
         if(!data.event) {
            await this.showNoEventsKeyboard(ctx, lang)
         }
         if(data.event) {
            await this.showEventsList(ctx, data)
         }
      }
      if(ctx.session.query === 'showAllUsersEvents') {
         const userData = await this.eventsService.findUsersClosestUpcomingEvent(ctx.from.id)
         if(!userData.event) {
            await this.showNoUserEventsKeyboard(ctx, lang)
         }
         if(userData.event) {
            await this.showEventsList(ctx, userData)
         }
      }
   }

   async showEventsList(@Ctx() ctx: Context, data) {
      const lang = ctx.session.language
      ctx.session.currentEvent = data.event
      const eventText = await this.eventCreateScene.genEventText(ctx)
      return await ctx.replyWithPhoto(
         ctx.session.currentEvent.photo || 'https://via.placeholder.com/300',
         {
            caption: eventText,
            reply_markup: {
               inline_keyboard: this.eventsKeyboard.viewer(lang),
            },
         },
      );
   }

   async showNoEventsKeyboard(@Ctx() ctx: Context, lang) {
      const msg = await ctx.reply(this.eventsKeyboard.title.allNoData[lang], {
         reply_markup: {
            inline_keyboard: this.eventsKeyboard.noEvents(lang),
         }}
      )
      ctx.session.messageIdToEdit = msg.message_id
   }
   async showNoUserEventsKeyboard(@Ctx() ctx: Context, lang) {
      const msg = await ctx.reply(this.eventsKeyboard.title.usersNoData[lang], {
         reply_markup: {
            inline_keyboard: this.eventsKeyboard.noUsersEvents(lang),
         }}
      )
      ctx.session.messageIdToEdit = msg.message_id
   }


   @Action('add_event')
   async addEvent(@Ctx() ctx: Context) {
      ctx.session.query = ''
      ctx.session.prevScene = 'EVENTS_LIST_SCENE'
      await ctx.scene.enter('EVENT_CREATE_SCENE')
   }

   @Action('all_events')
   async showAllEvents(@Ctx() ctx: Context) {
      ctx.session.query = 'showAllEvents'
      await ctx.scene.enter('EVENTS_LIST_SCENE')
   }

   @On('text')
   async handleTextInput(@Ctx() ctx: Context, @Message() message) {
      ctx.session.messageToDelete.push(message.message_id);
      await this.botService.checkGlobalCommand(ctx, message.text, 'EVENTS_LIST_SCENE')
      const lng = ctx.session.language
   }

   @On('callback_query')
   async checkCallback(@Ctx() ctx: Context) {
      if(ctx.callbackQuery && 'data' in ctx.callbackQuery) {
         const isGlobal = await this.botService.checkGlobalActions(ctx, ctx.callbackQuery.data, 'EVENTS_LIST_SCENE')
         if(!isGlobal) {
            await ctx.deleteMessage()
            await ctx.answerCbQuery('Сообщение устарело');
            console.log('Удаление сообщения из EVENTS_LIST_SCENE')
         }
      }
   }
}