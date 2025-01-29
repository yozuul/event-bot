export const languageKeyboard = (lang, isAdmin) => {
   const t = (uz, ru) => (lang === 'uz' ? uz : ru);
   const keyboard = [
      [
         {
            text: `🇺🇿 O‘zbekcha ${lang === 'uz' ? '🟢' : '⚪️'}`,
            callback_data: 'set_lang_uz',
         },
         {
            text: `🇷🇺 Русский ${lang === 'ru' ? '🟢' : '⚪️'}`,
            callback_data: 'set_lang_ru',
         },
      ],
      [
         {
            text: t('Davom etish', 'Продолжить'),
            callback_data: 'go_to_welcome',
         }
      ]
   ]
   const adminBtn1 = [
      {
         text: t('Kategoriyalarni tahrirlash', 'Редактирование категорий'),
         callback_data: 'edit_category',
      },
      {
         text: t('Moderatsiyadagi tadbirlar', 'Мероприятия на модерации'),
         callback_data: 'show_moderate',
      }
   ]
   const adminBtn2 = [
      {
         text: t('Administratorlarni yangilash', 'Обновить администраторов'),
         callback_data: 'update_admins',
      }
   ]
   if(isAdmin) {
      keyboard.push(adminBtn1)
      keyboard.push(adminBtn2)
   }
   return keyboard
}
