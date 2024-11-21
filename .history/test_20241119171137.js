const { Telegraf } = require('telegraf');

const bot = new Telegraf('.env');
bot.start((ctx) => ctx.reply('Welcome!'));
bot.launch();
console.log('Bot is running');