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
  points: 15, // Number of points
  duration: 20 * 60, // 20 minutes
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

const MAX_SIZE = 2000;
const GlobalStoreReferralCodes = new Map();

function addReferralCode(userId, referralCode) {
  if (GlobalStoreReferralCodes.size >= MAX_SIZE) {
    const oldestKey = GlobalStoreReferralCodes.keys().next().value;
    GlobalStoreReferralCodes.delete(oldestKey);
  }
  
  GlobalStoreReferralCodes.set(userId, referralCode);
}

function getReferralCode(userId) {
  return GlobalStoreReferralCodes.get(userId) || null;
}

bot.start((ctx) => {
  try {
    const args = ctx.message.text.split(' ');
    let referralCode = null;
    
    if (args.length > 1) {
      referralCode = args[1];
      addReferralCode(ctx.from.id,referralCode)
    } else {
      referralCode = getReferralCode(ctx.from.id) || null
    }

    const userId = ctx.from.id;
    const username = ctx.from.username || 'Unknown';
    const first_name = ctx.from.first_name || 'Unknown';

    const dataToEncrypt = {
      user_id: userId,
      username,
      first_name,
      inviter_code: referralCode ? referralCode : '',
    };
    
    const encryptedData = encryptData(dataToEncrypt);
    const webAppUrlWithParams = `${WEBAPP_URL}?data=${encodeURIComponent(encryptedData)}`;
    
    console.log(GlobalStoreReferralCodes , ': GlobalStoreReferralCodes');
    // console.log(webAppUrlWithParams);
    // console.log('Referral Code:', referralCode);

    const caption = `
    `.trim();
    
    ctx.replyWithPhoto(
     'https://repository-images.githubusercontent.com/813960882/7119d501-f157-40ea-b416-a1c3a72239f5' ,
      {
        caption: '',
        parse_mode: 'MarkdownV2',
        ...Markup.inlineKeyboard([
          [
            Markup.button.webApp('Open App', webAppUrlWithParams)        
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

const PORT = process.env.PORT || 3000


app.listen(PORT, () => {
  try {
    bot.launch();
    console.log('Bot launched successfully!');
  } catch (err) {
    console.log('Failed to launch bot:', err);
  }
  console.log(`Express server is running on port ${PORT}`);
});
