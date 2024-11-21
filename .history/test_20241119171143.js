const { Telegraf } = require('telegraf');

const bot = new Telegraf('7835953464:AAFcJ9q1NY9BtKY02QNw8Ri8Qf2OOHPQOws');
bot.start((ctx) => ctx.reply('Welcome!'));
bot.launch();
console.log('Bot is running');