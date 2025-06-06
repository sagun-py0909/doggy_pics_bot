const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const { Telegraf, Markup } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const bot = new Telegraf(BOT_TOKEN);
const userDogCounts = {}; // Tracks dog pics seen per user

// Custom keyboard
const mainKeyboard = Markup.keyboard([
  ['/start', '/help'],
  ['/stop']
]).resize();

// /start command
bot.start((ctx) => {
  ctx.reply(
    `Hello ${ctx.from.first_name}! 🐶 Welcome to DoggyBot!\nSend me anything or choose an option below.`,
    mainKeyboard
  );
});

// /help command
bot.help((ctx) => {
  ctx.reply(
    `🐾 *DoggyBot Help*\n\n` +
    `Just send any message and I’ll send you a random dog photo.\n\n` +
    `You can also say things like:\n` +
    `• "Send me a labrador"\n` +
    `• "Show me a pug"\n\n` +
    `Commands:\n/start – Welcome message\n/help – This help text\n/stop – Stop the bot`,
    { parse_mode: 'Markdown' }
  );
});

// /stop command
bot.command('stop', (ctx) => {
  ctx.reply('Bot stopped. Send /start to begin again 🐕‍🦺');
});

// Generic text message handler
bot.on('text', async (ctx) => {
  const message = ctx.message.text.toLowerCase();

  // Handle breed request like "show me a pug"
  const breedMatch = message.match(/(send me a|show me a) (\w+)/i);
  if (breedMatch) {
    const breed = breedMatch[2].toLowerCase();
    return sendBreedImage(ctx, breed);
  }

  return sendRandomDog(ctx);
});

// Handle "Next Dog" button
bot.action('NEXT_DOG', async (ctx) => {
  await sendRandomDog(ctx);
  await ctx.answerCbQuery();
});

// Handle "Next [Breed]" button
bot.action(/^NEXT_BREED_(\w+)$/, async (ctx) => {
  const breed = ctx.match[1];
  await sendBreedImage(ctx, breed);
  await ctx.answerCbQuery();
});

// Send random dog image
async function sendRandomDog(ctx) {
  try {
    const res = await fetch('https://dog.ceo/api/breeds/image/random');
    const data = await res.json();

    await ctx.replyWithPhoto(
      { url: data.message },
      Markup.inlineKeyboard([Markup.button.callback('Next Dog 🐶', 'NEXT_DOG')])
    );

    trackUser(ctx.from.id, ctx);
  } catch (err) {
    console.error(err);
    ctx.reply('Oops! Failed to fetch a dog image 🐾');
  }
}

// Send specific breed image
async function sendBreedImage(ctx, breed) {
  try {
    const res = await fetch(`https://dog.ceo/api/breed/${breed}/images/random`);
    const data = await res.json();

    if (data.status === 'success') {
      await ctx.replyWithPhoto(
        { url: data.message },
        Markup.inlineKeyboard([
          Markup.button.callback(`Next ${breed} 🐶`, `NEXT_BREED_${breed}`)
        ])
      );

      trackUser(ctx.from.id, ctx);
    } else {
      ctx.reply(`Sorry, I couldn't find any dogs of breed "${breed}" 🐾`);
    }
  } catch (err) {
    console.error(err);
    ctx.reply(`Error fetching ${breed} 🐶`);
  }
}

// Track how many dog pics a user has seen
function trackUser(userId, ctx) {
  userDogCounts[userId] = (userDogCounts[userId] || 0) + 1;
  ctx.reply(`You've seen ${userDogCounts[userId]} dogs 🐶 so far!`);
}

// Launch the bot
bot.launch().then(() => {
  console.log('🚀 Telegram bot is running...');
});

// Express server (for uptime pings on render)
app.get('/', (req, res) => {
  res.send('Telegram DoggyBot is running! 🐾');
});
app.listen(PORT, () => {
  console.log(`🌐 Express server running on http://localhost:${PORT}`);
});
