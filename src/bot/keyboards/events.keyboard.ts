import { Injectable } from '@nestjs/common';
import {session} from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/types';

const t = (lng, uz, ru) => (lng === 'uz' ? uz : ru);

const approveEventButton = (lang, eventId?) => [
   { text: t(lang, '👍 Тасдиқлаш', '👍 Подтвердить'), callback_data: `approve_event_${eventId}` },
   { text: t(lang, '👎 Рад этмоқ', '👎 Отклонить'), callback_data: `decline_event_${eventId}` },
]
const editEventButton = (lang, eventId?) => {
   const defaultKeyboard = [
      {
         text: t(lang, '📅 Tahrir qilish', '📅 Редактировать '),
         callback_data: 'edit_event'
      }
   ]
   const urlKeyboard = [
      {
         text: t(lang, '📅 Tahrir qilish', '📅 Редактировать '),
         url: `https://t.me/${process.env.BOT_USERNAME}?start=${eventId}`
      }
   ]

   const goToGroupKeyboard = [
      {
         text: t(lang, '📅 Tahrir qilish', '📅 Редактировать '),
         url: `https://t.me/${process.env.PUBLIC_GROUP_USERNAME}`
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
      text: t(lang, `🗑 O‘chirish`, '🗑 Удалить'),
      callback_data: eventId ? `delete_event_${eventId}` : 'delete_event'
   }
];

const publicToGroupText = (session, eventId) => {
   if(session.user) {
      return '✅ В группу'
   }
   return session.checkboxes[eventId]?.public_to_group ? '✅ В группу' : '⬜️ В группу';
}
const publicToBotText = (session, eventId) => {
   if(session.user) {
      return '✅ Внутри бота'
   }
   return session.checkboxes[eventId]?.public_to_bot
   ? '✅ Внутри бота'
   : '⬜️ Внутри бота';
}

@Injectable()
export class EventsKeyboard {
   get title() {
      return {
         users : {
            uz: 'Sizning tadbirlaringiz', ru: 'Ваши мероприятия'
         },
         usersNoData : {
            uz: `Siz hali biror tadbir qo'shmagansiz`, ru: 'Вы пока не добавили ни одного мероприятия'
         },
         all: {
            uz: 'Shaharingizdagi tadbirlar', ru: 'Мероприятия вашего города'
         },
         allNoData: {
            uz: `Tadbirlar topilmadi. Birinchi bo‘lishingiz mumkin`, ru: 'Мероприятия не найдены. Вы можете быть первым'
         }
      }
   }

   addEditEvent(lang, canSave?, canEdit?, canDelete?, isAdmin?, isApproved?, session?) {

      let keyboard = [
         [
            { text: t(lang, 'Nom', 'Название'), callback_data: 'edit_event_name' },
            { text: t(lang, 'Foto', 'Фото'), callback_data: 'edit_event_photo' },
         ],
         [
            { text: t(lang, 'Tavsif', 'Описание'), callback_data: 'edit_event_description' },
            { text: t(lang, 'Narx', 'Стоимость'), callback_data: 'edit_event_cost' },
         ],
         [
            { text: t(lang, 'Sana', 'Дата'), callback_data: 'edit_event_date' },
            { text: t(lang, 'Sana oralig‘i', 'Диапазон дат'), callback_data: 'edit_event_date_raw' },
         ],
         [
            { text: t(lang, 'Kategoriya', 'Категория'), callback_data: 'edit_event_category' },
            { text: t(lang, 'Telefon', 'Телефон'), callback_data: 'edit_event_phone' },
         ],
         [
            { text: t(lang, "Aloqani o'zgartirish", 'Изменить контакт'), callback_data: 'edit_organisation_contact' },
         ],
         // [
         //    {
         //       text: t(lang, 'Тест', 'Тест'), callback_data: 'test',
         //    }
         // ]
      ];

      const goBackButton = [{ text: t(lang, '⬅️ Орқа', '⬅️ Назад'), callback_data: 'go_back' }]
      const saveEventButton = [
         { text: t(lang, '👁‍🗨 Tekshirishga yuborish', '👁‍🗨 Отправить на проверку'), callback_data: 'save_event' }
      ]
      const updateEventButton = [
         { text: t(lang, '📅 Saqlash', '📅 Сохранить'), callback_data: 'update_event' }
      ]
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
               { text: publicToGroupText(session, isApproved), callback_data: `publicToGroup_${isApproved}` },
               { text: publicToBotText(session, isApproved), callback_data: `publicToBot_${isApproved}` },
            ],
            approveEventButton(lang, isApproved),
            // editEventButton(lang, isApproved) as any,
            deleteEventButton(lang, isApproved),
         )
      }
      return keyboard
   };

   viewer(lang, prev?, next?, count?, canEdit?, session?, isApproved?, currentEvent?) {
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
      const discussLink = `${process.env.PUBLIC_CHANNEL_URL}/${currentEvent.groupPostId}/?comment=1`
      console.log(discussLink)
      const comment = [
         {
            text: t(lang, '💬 Komment qilish', '💬 Комментировать '),
            url: discussLink
         }
      ]

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
      keyboard.push(comment)
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
      // console.log('keyboard', currentEvent)
      if(isApproved) {
         if(session.query !== 'showModerateEvents') {
            keyboard.push([
               { text: publicToGroupText(session, isApproved), callback_data: `publicToGroup_${currentEvent.id}` },
               { text: publicToBotText(session, isApproved), callback_data: `publicToBot_${currentEvent.id}` },
            ])
         }
         keyboard.push(
            approveEventButton(lang, currentEvent.id),
            deleteEventButton(lang, currentEvent.id),
         )
      }
      if(currentEvent.published) {
         keyboard.push([
            { text: `👍 ${currentEvent.likes}`, callback_data: `like_${currentEvent.id}` },
            { text: `👎 ${currentEvent.dislikes}`, callback_data: `dislike_${currentEvent.id}` },
         ])
      }
      return keyboard
   };

   noUsersEvents (lang) {
      const keyboard = [
         [
            { text: t(lang, `📅 Tadbir qo'shish`, '📅 Добавить мероприятие'), callback_data: 'add_event' },
         ],
         [
            { text: t(lang, `Hammasini ko'rsatish`, 'Показать все'), callback_data: 'all_events' },
         ],
         [
            { text: t(lang, '⬅️ Orqaga', '⬅️ Назад'), callback_data: 'go_back' },
         ],
      ];
      return keyboard
   };

   noEvents (lang, showCalendar?) {
      const keyboard = [
         [
            { text: t(lang, '📅 Тадбир қўшиш', '📅 Добавить мероприятие'), callback_data: 'add_event' },
         ],
         [
            { text: t(lang, '⬅️ Орқа', '⬅️ Назад'), callback_data: 'go_back' },
         ],
      ];
      if(showCalendar) {
         keyboard.push(
            [{ text: t(lang, 'Бошқа санани танлаш', 'Выбрать другую дату'), callback_data: 'show_calendar' }]
         )
      }
      return keyboard
   };
}