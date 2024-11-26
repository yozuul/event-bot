import { Injectable } from '@nestjs/common';

@Injectable()
export class CalendarService {
   generateCalendar(year: number, month: number, lang): any {
      const now = new Date();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();
      const today = now.getDate();
      const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

      const daysOfWeek = {
         ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вск'],
         uz: ['Дш', 'Сш', 'Чш', 'Пш', 'Жм', 'Шн', 'Якш']
      };

      const days = [];
      for (let i = 0; i < firstDay; i++) days.push({ text: ' ', callback_data: 'empty' });
      for (let day = 1; day <= daysInMonth; day++) {
         const isDisabled = isCurrentMonth && day < today;
         days.push({
            text: isDisabled ? ' ' : day.toString(),
            callback_data: isDisabled ? 'empty' : `select_day_${day}`,
         });
      }
      while (days.length % 7 !== 0) {
         days.push({ text: ' ', callback_data: 'empty' }); // Выравнивание до 7 кнопок
      }
      // Разделение на недели
      const rows = [];
      while (days.length) rows.push(days.splice(0, 7));
      // Навигация
      const prevMonth = month - 1 < 0 ? 11 : month - 1;
      const nextMonth = month + 1 > 11 ? 0 : month + 1;
      const prevYear = month - 1 < 0 ? year - 1 : year;
      const nextYear = month + 1 > 11 ? year + 1 : year;

      return {
         inline_keyboard: [
            [
               { text: '<', callback_data: `change_month_${prevYear}_${prevMonth}` },
               { text: `${year} / ${month + 1}`, callback_data: 'noop' },
               { text: '>', callback_data: `change_month_${nextYear}_${nextMonth}` },
            ],
            daysOfWeek[lang].map((day) => ({ text: day, callback_data: 'noop' })), // Добавление дней недели
            ...rows.map((row) =>
               row.map((day) => ({
                  text: day.text,
                  callback_data: day.callback_data,
               })),
            ),
         ],
      };
   }
}