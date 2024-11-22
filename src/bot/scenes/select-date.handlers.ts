import { Injectable } from '@nestjs/common';
import { Action, Ctx } from 'nestjs-telegraf';
import { Context } from '../context.interface';
import { CalendarService } from '../date-services';

@Injectable()
export class DateSelectionHandler {
  constructor(private readonly calendarService: CalendarService) {}

  @Action('test')
  async changeMonth(@Ctx() ctx: Context) {
   console.log('ddddd TEST')
//     let match = null;
//     if ('data' in ctx.callbackQuery && ctx.callbackQuery.data) {
//       match = ctx.callbackQuery.data.match(/change_month_(\d+)_(\d+)/);
//     }
//     const year = parseInt(match[1], 10);
//     const month = parseInt(match[2], 10);
//     const lang = ctx.session.language;
//
//     // Генерация календаря
//     const calendar = this.calendarService.generateCalendar(year, month, lang);
//     await ctx.editMessageReplyMarkup(calendar);
  }
}