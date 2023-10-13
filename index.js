const { Telegraf } = require('telegraf');
const { RateLimiterMemory } = require('rate-limiter-flexible');
require('dotenv').config();

// Telegram bot API token
const apiToken = process.env.API_TOKEN_DEV;

// Instantiate Telegraf bot
const bot = new Telegraf(apiToken);

// Define rate limiting options
const rateLimiterOpts = {
  points: 5,  // Number of points
  duration: 1, // Per second(s)
};

// Initialize rate limiter
const rateLimiter = new RateLimiterMemory(rateLimiterOpts);

// Create a Map to store timeout data
const chatTimeouts = new Map();

bot.launch();

bot.on('callback_query', async (ctx) => {

  if (await limitExceeded(ctx, chatId)) { return; }

  ctx.reply("Continue Your Application Development ")


}


//==============
//  DDOS Check
//==============

// Function to check rate limit for a given chatId
async function limitExceeded(ctx, chatId) {
  
  try {


    // Check if the chatId is allowed to proceed based on the rate limiter
    await rateLimiter.consume(chatId);

    // Check if the chatId is in the timeout period
    if (chatTimeouts.has(chatId)) {
      
      const timeout = chatTimeouts.get(chatId);

      // Check if the chatId is still in the timeout period
      if (timeout > Date.now()) {
        const remainingSeconds = Math.ceil((timeout - Date.now()) / 1000);
        ctx.reply(`You are sending too many requests! ${remainingSeconds} seconds timeout.`);
        return true;
      }

      // Remove the timeout if it has expired
      chatTimeouts.delete(chatId);
    }

    // Return false if the rate limit is not exceeded and the chatId is not in the timeout period
    return false;

  } catch (error) {

    ctx.reply("You are sending too many requests!.");

    // Set a new timeout for the chatId
    const timeout = Date.now() + 10000; // Set the timeout to 10 seconds from the current time
    chatTimeouts.set(chatId, timeout);

    return true;

  }
}

