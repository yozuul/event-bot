import { Injectable } from '@nestjs/common';
import { Ctx } from 'nestjs-telegraf';
import { Context } from '../context.interface';

function roundToNearestFiveMinutes(date: Date): { hour: number; minute: number } {
   const minutes = date.getMinutes();
   const roundedMinutes = Math.ceil(minutes / 5) * 5;
   const hour = roundedMinutes === 60 ? date.getHours() + 1 : date.getHours();
   const minute = roundedMinutes === 60 ? 0 : roundedMinutes;
   return { hour: hour % 24, minute };
}

@Injectable()
export class TimeSelectionService {
   generateTimeKeyboard(selectedHour: number, selectedMinute: number): any {
      const emojiTime = `${this.formatEmoji(selectedHour)}:${this.formatEmoji(selectedMinute)}`;
      return {
         inline_keyboard: [
            [
               { text: '+', callback_data: 'increment_hour' },
               { text: '-', callback_data: 'decrement_hour' },
               { text: `ВРЕМЯ`, callback_data: 'default_callback_time' },
               { text: '+', callback_data: 'increment_minute' },
               { text: '-', callback_data: 'decrement_minute' },
            ],
            [{ text: emojiTime, callback_data: 'default_callback_time' }],
            [
               { text: 'Подтвердить', callback_data: 'confirm_time' },
               { text: 'Отмена', callback_data: 'cancel_time' },
            ],
         ],
      };
   }

   formatEmoji(value: number): string {
      return value
         .toString()
         .padStart(2, '0')
         .split('')
         .map((digit) => `${digit}️⃣`)
         .join('');
   }

   adjustTime(hour: number, minute: number, action: string, @Ctx() ctx: Context): { hour: number; minute: number } {
      const now = new Date();
      const isToday = ctx.session.currentEvent.date === now.toDateString();
      ctx.session.currentEvent.selectedTime = isToday
         ? roundToNearestFiveMinutes(now)
         : { hour: 12, minute: 0 };

      switch (action) {
         case 'increment_hour':
            hour = (hour + 1) % 24;
            break;
         case 'decrement_hour':
            hour = hour === 0 ? 23 : hour - 1;
            break;
         case 'increment_minute':
            minute = (minute + 5) % 60;
            if (minute === 0) hour = (hour + 1) % 24; // Переход на следующий час
            break;
         case 'decrement_minute':
            minute = minute === 0 ? 55 : minute - 5;
            if (minute === 55) hour = hour === 0 ? 23 : hour - 1; // Переход на предыдущий час
            break;
      }
      // Проверяем ограничения для текущей даты
      if (isToday) {
         const currentHour = now.getHours();
         const currentMinute = now.getMinutes();

         if (hour < currentHour || (hour === currentHour && minute < currentMinute)) {
            return { hour: currentHour, minute: currentMinute };
         }
      }

      return { hour, minute };
   }


}
