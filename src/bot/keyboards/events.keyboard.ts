import { Injectable } from '@nestjs/common';
import { InlineKeyboardButton } from 'telegraf/types';

const t = (lng, uz, ru) => (lng === 'uz' ? uz : ru);

const approveEventButton = (lang, eventId?) => [
   { text: t(lang, '👍 Тасдиқлаш', '👍 Подтвердить'), callback_data: `approve_event_${eventId}` },
   { text: t(lang, '👎 Рад этмоқ', '👎 Отклонить'), callback_data: `decline_event_${eventId}` },
]
const editEventButton = (lang, eventId?) => {
   const defaultKeyboard = [
      {
         text: t(lang, '📅 Таҳрирлаш', '📅 Редактировать '),
         callback_data: 'edit_event'
      }
   ]
   const urlKeyboard = [
      {
         text: t(lang, '📅 Таҳрирлаш', '📅 Редактировать '),
         url: `https://t.me/${process.env.BOT_USERNAME}?start=${eventId}`
      }
   ]
   if(!eventId) {
      return defaultKeyboard
   }
   if(eventId) {
      return urlKeyboard
   }
}

const deleteEventButton = (lang, eventId?) => [
   {
      text: t(lang, '🗑 Ўчириш', '🗑 Удалить'),
      callback_data: eventId ? `delete_event_${eventId}` : 'delete_event'
   }
];

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

   addEditEvent(lang, canSave?, canEdit?, canDelete?, isAdmin?, isApproved?, session?) {
      const publicToGroupText = session.checkboxes?.public_to_group
      ? '✅ В группу'
      : '⬜️ В группу';
      const publicToBotText = session.checkboxes?.public_to_bot
         ? '✅ Внутри бота'
         : '⬜️ Внутри бота';

      let keyboard = [
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
         // [
         //    {
         //       text: t(lang, 'Тест', 'Тест'), callback_data: 'test',
         //    }
         // ]
      ];

      const goBackButton = [{ text: t(lang, '⬅️ Орқа', '⬅️ Назад'), callback_data: 'go_back' }]
      const saveEventButton = [
         { text: t(lang, '👁‍🗨 Текширувга юбориш', '👁‍🗨 Отправить на проверку'), callback_data: 'save_event' }
      ]
      const updateEventButton = [{ text: t(lang, '📅 Сақлаш', '📅 Сохранить'), callback_data: 'update_event' }]
      if(canSave) {
         if(!canEdit) {
            keyboard.push(saveEventButton)
         }
         if(canEdit) {
            keyboard.push(updateEventButton)
         }
         if(canDelete) {
            keyboard.push(deleteEventButton(lang, isApproved))
         }
         keyboard.push(goBackButton)
      } else {
         keyboard.push(goBackButton)
      }
      if(isApproved) {
         keyboard = []
         keyboard.push([
               { text: publicToGroupText, callback_data: `publicToGroup_${isApproved}` },
               { text: publicToBotText, callback_data: `publicToBot_${isApproved}` },
            ],
            approveEventButton(lang, isApproved),
            // editEventButton(lang, isApproved) as any,
            deleteEventButton(lang, isApproved),
         )
      }
      return keyboard
   };

   viewer(lang, prev?, next?, count?, canEdit?, canApprove?) {
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
      const goBackButton = [{ text: t(lang, '⬅️ Орқа', '⬅️ Назад'), callback_data: 'go_back' }]
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
         keyboard.push(editEventButton(lang))
         keyboard.push(deleteEventButton(lang))
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