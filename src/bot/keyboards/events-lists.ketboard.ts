const t = (lng, uz, ru) => (lng === 'uz' ? uz : ru);

export const keyboardTitle = {
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

export const eventsListKeyboard = (lang, canEdit?) => {
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
   const saveEventButton = [{ text: t(lang, '📝 Таҳрирлаш', '📝 Редактировать'), callback_data: 'save_event' }]
   if(canEdit) {
      keyboard.push(saveEventButton)
      keyboard.push(goBackButton)
   } else {
      keyboard.push(goBackButton)
   }
   return keyboard
};


export const TRANSLATION = {
   EVENTS: {
      NO_USER_EVENTS_MESSAGE: {
         uz: 'Сиз ҳали бирор тадбир қўшмadingiz', ru: 'Вы пока не добавили ни одного мероприятия'
      },
      ADD_EVENT_BTN: {
         uz: '📅 Тадбир қўшиш', ru: '📅 Добавить мероприятие'
      },
      GOBACK_EVENT_BTN: {
         uz: '⬅️ Орқа', ru: '⬅️ Назад'
      },
      SHOW_ALL_EVENT_BTN: {
         uz: 'Ҳаммасини кўрсатиш', ru: 'Показать все'
      },
   }
}