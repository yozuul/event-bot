import { Injectable } from '@nestjs/common';
const t = (lng, uz, ru) => (lng === 'uz' ? uz : ru);

@Injectable()
export class EventsKeyboard {
   get title() {
      return {
         users : {
            uz: 'Сизнинг тадбирларингиз', ru: 'Ваши мероприятия'
         },
         usersNoData : {
            uz: 'Сиз ҳали бирор тадбир қўшмadingiz', ru: 'Вы пока не добавили ни одного мероприятия'
         },
         all: {
            uz: 'Шаҳарингиздаги тадбирлар', ru: 'Мероприятия вашего города'
         },
         allNoData: {
            uz: 'Тадбирлар топилмади. Биринчи бўлишингиз мумкин', ru: 'Мероприятия не найдены. Вы можете быть первым'
         }
      }
   }

   addEditEvent(lang, canSave?, edit?) {
      const keyboard = [
         [
            { text: t(lang, 'Номи', 'Название'), callback_data: 'edit_event_name' },
            { text: t(lang, 'Расм', 'Фото'), callback_data: 'edit_event_photo' },
         ],
         [
            { text: t(lang, 'Тавсиф', 'Описание'), callback_data: 'edit_event_description' },
            { text: t(lang, 'Сана', 'Дата'), callback_data: 'edit_event_date' },
         ],
         [
            { text: t(lang, 'Нархи', 'Стоимость'), callback_data: 'edit_event_cost' },
            { text: t(lang, 'Категория', 'Категория'), callback_data: 'edit_event_category' },
         ],
         [
            { text: t(lang, 'Алоқа телефони', 'Контактный телефон'), callback_data: 'edit_event_phone' },
         ],
      ];
      const goBackButton = [{ text: t(lang, '⬅️ Орқа', '⬅️ Назад'), callback_data: 'go_back' }]
      const saveEventButton = [{ text: t(lang, '📅 Сақлаш', '📅 Сохранить'), callback_data: 'save_event' }]
      const updateEventButton = [{ text: t(lang, '📅 Сақлаш', '📅 Сохранить'), callback_data: 'update_event' }]
      const deleteEventButton = [{ text: t(lang, '🗑 Ўчириш', '🗑 Удалить'), callback_data: 'delete_event' }]
      if(canSave) {
         if(!edit) {
            keyboard.push(saveEventButton)
         }
         if(edit) {
            keyboard.push(updateEventButton)
         }
         keyboard.push(deleteEventButton)
         keyboard.push(goBackButton)
      } else {
         keyboard.push(goBackButton)
      }
      return keyboard
   };

   viewer(lang, prev?, next?, count?, canEdit?) {
      const keyboard = [];
      const noPrev = [
         { text: '', callback_data: 'empty' },
         { text: count, callback_data: 'empty' },
         { text: '➡️', callback_data: 'forward' },
      ]
      const noNext = [
         { text: '⬅️', callback_data: 'backward' },
         { text: count, callback_data: 'empty' },
         { text: '', callback_data: 'empty' },
      ]
      const noNextPrev = [
         { text: '', callback_data: 'empty' },
         { text: count, callback_data: 'empty' },
         { text: '', callback_data: 'empty' },
      ]
      const fullNavi = [
         { text: '⬅️', callback_data: 'backward' },
         { text: count, callback_data: 'empty' },
         { text: '➡️', callback_data: 'forward' },
      ]
      const editEventButton = [{ text: t(lang, '📅 Таҳрирлаш', '📅 Редактировать '), callback_data: 'edit_event' }]
      const goBackButton = [{ text: t(lang, '⬅️ Орқа', '⬅️ Назад'), callback_data: 'go_back' }]
      const deleteEventButton = [{ text: t(lang, '🗑 Ўчириш', '🗑 Удалить'), callback_data: 'delete_event' }]
      const fullDesription = [{ text: t(lang, 'Тўлиқ тавсиф', 'Полное описание'), callback_data: 'full_event' }]

      if(!prev && next) {
         keyboard.push(noPrev)
      }
      if(prev && !next) {
         keyboard.push(noNext)
      }
      if(!prev && !next) {
         keyboard.push(noNextPrev)
      }
      if(prev && next) {
         keyboard.push(fullNavi)
      }
      if(canEdit) {
         keyboard.push(editEventButton)
         keyboard.push(deleteEventButton)
         // keyboard.push(fullDesription)
         keyboard.push(goBackButton)
      }
      if(!canEdit) {
         // keyboard.push(fullDesription)
         keyboard.push(goBackButton)
      }
      return keyboard
   };

   noUsersEvents (lang) {
      const keyboard = [
         [
            { text: t(lang, '📅 Тадбир қўшиш', '📅 Добавить мероприятие'), callback_data: 'add_event' },
         ],
         [
            { text: t(lang, 'Ҳаммасини кўрсатиш', 'Показать все'), callback_data: 'all_events' },
         ],
         [
            { text: t(lang, '⬅️ Орқа', '⬅️ Назад'), callback_data: 'go_back' },
         ],
      ];
      return keyboard
   };

   noEvents (lang) {
      const keyboard = [
         [
            { text: t(lang, '📅 Тадбир қўшиш', '📅 Добавить мероприятие'), callback_data: 'add_event' },
         ],
         [
            { text: t(lang, '⬅️ Орқа', '⬅️ Назад'), callback_data: 'go_back' },
         ],
      ];
      return keyboard
   };
}