export const categoryKeyboard = (lang, existCategory?, isEditMode?) => {
   const t = (uz, ru) => (lang === "uz" ? uz : ru); // Функция для выбора правильного языка
   const keyboard = [[
      {
         text: t("📅 Категория қўшиш", "📅 Показать все мероприятия"),
         callback_data: "show_all_events",
      },
   ]]
   // Кнопка добавления категории
   const addCategory = [
      {
         text: t("Категория қўшиш", "Добавить категорию"),
         callback_data: "add_category",
      },
   ];
   // Если нет категорий и редактирование разрешено
   if (existCategory.length === 0 && isEditMode) {
      keyboard.push(addCategory);
   }
   // Если категории существуют
   if (existCategory.length > 0) {
      // Для режима редактирования
      if (isEditMode) {
         // Для каждой категории выводим кнопку с возможностью удаления и редактирования
         existCategory.forEach((category) => {
            keyboard.push([
               {
                  text: t(category.uz, category.ru),
                  callback_data: `edit_category_${category.id}`,
               },
               {
                  text: t('🗑', '🗑'),
                  callback_data: `delete_category_${category.id}`, // удалить категорию
               },
            ]);
         });
         keyboard.push(addCategory)
      }
      // Для обычного режима, выводим категории двумя кнопками в строку
      else {
         let row = [];
         existCategory.forEach((category, index) => {
            row.push({
               text: t(category.uz, category.ru),
               callback_data: `select_category_${category.id}`,
            });
            if (row.length === 2) {
               keyboard.push(row);
               row = [];
            }
         });
         if (row.length > 0) {
            keyboard.push(row);
         }
      }
   }
   return keyboard;
};
