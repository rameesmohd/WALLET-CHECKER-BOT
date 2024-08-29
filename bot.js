const { Markup, Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const dotenv = require('dotenv');
const CryptoJS = require('crypto-js');
const path = require('path');
const express = require('express');
const { RateLimiterMemory } = require('rate-limiter-flexible');

dotenv.config();

const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY;
const bot = new Telegraf(TELEGRAM_API_KEY);
const WEBAPP_URL = process.env.WEBAPP_URL;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

const rateLimiter = new RateLimiterMemory({
  points: 15, 
  duration: 20 * 60, 
});

bot.use(async (ctx, next) => {
  try {
    await rateLimiter.consume(ctx.from.id);
    await next(); 
  } catch (rlRejected) {
    ctx.reply('Too many requests. Please try again later.');
  }
});

function encryptData(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
}

// bot.use((ctx, next) => {
//   if (ctx.message) {
//     // console.log(`Received command: ${ctx.message.text}`);
//   }
//   return next();
// });


bot.start((ctx) => {
  try {
    ctx.replyWithPhoto(
     'https://repository-images.githubusercontent.com/813960882/7119d501-f157-40ea-b416-a1c3a72239f5' ,
      {
        caption: '',
        parse_mode: 'MarkdownV2',
        ...Markup.inlineKeyboard([
          [
            Markup.button.webApp('Open App', WEBAPP_URL)        
          ],
          // [
          //   Markup.button.url('ℹ What is GEN?','https://telegra.ph/GEN-COIN-07-18')
          // ],
          [
            Markup.button.url('👥 Community', 'https://t.me/+jEPYQZBFN0plZDI1'),
            Markup.button.url('🆘 Support', 'https://t.me/gencoinsupport')
          ],
        ])
      }
    );
  } catch (error) {
    console.log('Error in start command:', error);
    ctx.reply('An error occurred. Please try again.');
  }
});

const app = express();
app.use(express.json()); 

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  try {
    bot.launch();
    console.log('Bot launched successfully!');
  } catch (err) {
    console.log('Failed to launch bot:', err);
  }
  console.log(`Express server is running on port ${PORT}`);
});
