const express = require('express');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 3000;

// Replace with your Bot Token
const BOT_TOKEN = "7969172238:AAFYNxCr9xGtjz7EFf3-cw5VyXGmaeZdk20";

const bot = new Telegraf(BOT_TOKEN);

// Greeting when user starts the bot
bot.start((ctx) => {
  ctx.reply(`Hello ${ctx.from.first_name}! 🐶 Welcome to DoggyBot! Send me anything and I'll show you a cute dog.`);
});

// Reply with a random dog image
bot.on('text', async (ctx) => {
  try {
    const res = await fetch('https://dog.ceo/api/breeds/image/random');
    const data = await res.json();
    ctx.replyWithPhoto({ url: data.message });
    ctx.reply('Here is a cute dog for you! 🐕');
  } catch (err) {
    console.error(err);
    ctx.reply('Oops! Something went wrong 🐾');
  }
});
bot.on('STOP', (ctx)=>{
    ctx.reply('Stopping the bot. Goodbye! 👋');
    bot.stop();
})

// Launch bot
bot.launch().then(() => {
  console.log('Bot is running...');
});

// Express server (not necessary for bot, but useful for testing)
app.get('/', (req, res) => {
  res.send('Telegram DoggyBot is running!');
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
