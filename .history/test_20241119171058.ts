import { Telegraf } from 'telegraf';

const bot = new Telegraf('ваш_токен_бота');
bot.start((ctx) => ctx.reply('Welcome!'));
bot.launch();
console.log('Bot is running');