import { Injectable } from '@nestjs/common';
import { Context } from '../context.interface';

@Injectable()
export class LanguageKeyboard {
   async showLanguageMenu(ctx: Context) {
      const activeLanguage = ctx.session.language || 'uz';
      await ctx.reply('Tilni tanlang / Выберите язык:', {
         reply_markup: {
            inline_keyboard: [[
               {
                  text: `🇺🇿 O‘zbekcha ${activeLanguage === 'uz' ? '🟢' : '⚪️'}`,
                  callback_data: 'set_lang_uz',
               },
               {
                  text: `🇷🇺 Русский ${activeLanguage === 'ru' ? '🟢' : '⚪️'}`,
                  callback_data: 'set_lang_ru',
               },
            ], [{
               text: `Продолжить`,
               callback_data: 'go_to_next',
            }]],
         },
      });
   }

   async updateLanguageMenu(ctx: Context) {
      await ctx.editMessageReplyMarkup({
         inline_keyboard: [[
            {
               text: `🇺🇿 O‘zbekcha ${ctx.session.language === 'uz' ? '🟢' : '⚪️'}`,
               callback_data: 'set_lang_uz',
            },
            {
               text: `🇷🇺 Русский ${ctx.session.language === 'ru' ? '🟢' : '⚪️'}`,
               callback_data: 'set_lang_ru',
            },
         ],
         [{
            text: `Продолжить`,
            callback_data: 'go_to_next',
         }]],
      });
   }
}
