import { Injectable } from '@nestjs/common';

@Injectable()
export class TimeSelectionService {
   generateTimeKeyboard(selectedHour: number, selectedMinute: number): any {
      const emojiTime = `${this.formatEmoji(selectedHour)}:${this.formatEmoji(selectedMinute)}`;
      return {
         inline_keyboard: [
            [
               { text: '+', callback_data: 'increment_hour' },
               { text: '-', callback_data: 'decrement_hour' },
               { text: `ВРЕМЯ`, callback_data: 'noop' },
               { text: '+', callback_data: 'increment_minute' },
               { text: '-', callback_data: 'decrement_minute' },
            ],
            [{ text: emojiTime, callback_data: 'noop' }],
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

   adjustTime(hour: number, minute: number, action: string): { hour: number; minute: number } {
      const now = new Date();
      const isToday = now.getHours() === hour && now.getMinutes() === minute;

      switch (action) {
         case 'increment_hour':
            hour = (hour + 1) % 24;
            break;
         case 'decrement_hour':
            hour = hour === 0 ? 23 : hour - 1;
            break;
         case 'increment_minute':
            minute = (minute + 15) % 60;
            break;
         case 'decrement_minute':
            minute = minute === 0 ? 45 : minute - 15;
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
