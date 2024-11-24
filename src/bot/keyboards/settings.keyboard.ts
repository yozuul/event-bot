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
            text: t('Давом эттириш', 'Продолжить'),
            callback_data: 'go_to_welcome',
         }
      ]
   ]
   const adminKeyboard = [
      {
         text: t('Категорияларни таҳрирлаш', 'Редактирование категорий'),
         callback_data: 'edit_category',
      },
      {
         text: t('Тадбирлар модерацияда', 'Мероприятия на модерации'),
         callback_data: 'show_moderate',
      }
   ]
   if(isAdmin) {
      keyboard.push(adminKeyboard)
   }
   return keyboard
}
