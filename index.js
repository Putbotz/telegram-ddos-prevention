const { Telegraf } = require('telegraf');

// DDOS Prevention
const chatTimeouts = new Map();

// Callback Delay
const callBackTimeouts = new Map();

// Define the rate limiting options
const opts = {
  points: 1, // Number of points (requests) allowed
  duration: 1, // Time duration in seconds
};

// Create a rate limiter instance
const { RateLimiterMemory } = require('rate-limiter-flexible');
const rateLimiter = new RateLimiterMemory(opts); 
const callbackLimiter = new RateLimiterMemory(opts); 

// Load environment variables from .env file
require('dotenv').config();

apiToken = process.env.API_TOKEN_DEV;

bot = new Telegraf(apiToken, {
      telegram: { },
  });

bot.launch();

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

