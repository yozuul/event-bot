export const profileKeyboard = (lng: string) => {
   return [
      [
        { text: lng == 'uz' ? '👤 Ism' : '👤 Имя', callback_data: 'edit_name' },
        { text: lng == 'uz' ? '📷 Rasm' : '📷 Фото', callback_data: 'edit_photo' },
      ],
      [
        { text: lng == 'uz' ? '🎂 Yosh' : '🎂 Возраст', callback_data: 'edit_age' },
        { text: lng == 'uz' ? '📞 Telefon' : '📞 Телефон', callback_data: 'edit_phone' },
      ],
      [
         {
            text: `🇺🇿 O‘zbekcha ${lng === 'uz' ? '🟢' : '⚪️'}`,
            callback_data: 'set_lang_uz',
         },
         {
            text: `🇷🇺 Русский ${lng === 'ru' ? '🟢' : '⚪️'}`,
            callback_data: 'set_lang_ru',
         },
      ],
      [
        { text: lng == 'uz' ? 'Mening tadbirlarim' : 'Мои мероприятия', callback_data: 'my_events' }
      ],
      [
        { text: lng == 'uz' ? `Tadbir qo‘shish` : 'Добавить мероприятие', callback_data: 'add_event' }
      ],
      [
        { text: lng == 'uz' ? 'Administrator bilan bog‘lanish' : 'Связаться с администрацией',
          url: process.env.FEEDBACK_CHANNEL_URL }
      ],
      [
        { text: lng == 'uz' ? '⬅️ Orqaga' : '⬅️ Назад', callback_data: 'go_back' }
      ]
    ]
}