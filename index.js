const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalFollow = goals.GoalFollow;
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini AI
const ai = new GoogleGenAI({});

// 1. Create the Minecraft Bot Connection
const bot = mineflayer.createBot({
  host: 'Heronrinesmp.aternos.me',  // <--- Double check your Aternos IP here!
  port: 42139,                   
  username: 'SloboAI_Friend',    
  auth: 'offline'
});

// Load the pathfinder engine
bot.loadPlugin(pathfinder);

// Establish the movement grid safely AFTER the bot logs in and chunks load
bot.on('spawn', () => {
  console.log(`${bot.username} has spawned! Waiting 3 seconds for world stability...`);
  
  setTimeout(() => {
    try {
      const mcData = require('minecraft-data')(bot.version);
      if (mcData) {
        const movements = new Movements(bot, mcData);
        movements.allowFreeMotion = true;
        bot.pathfinder.setMovements(movements);
        console.log("Movement maps successfully configured! Bot is fully active.");
      }
    } catch (error) {
      console.log("Movement config skipped or failed, running in basic mode:", error);
    }
  }, 3000); // 3-second delay prevents Aternos lag kicks
});

// 2. Chat and AI Command Listener
bot.on('chat', async (username, message) => {
  if (username === bot.username) return;

  const msgLower = message.toLowerCase();
  const playerEntity = bot.players[username]?.entity;

  // --- PHYSICAL MOVEMENT COMMANDS ---
  if (msgLower === 'come here' || msgLower === 'follow me') {
    if (!playerEntity) {
      // Emergency feature: If the bot is completely stuck out of render distance, try to teleport it
      bot.chat("I can't see your character! Trying to teleport to you instead...");
      bot.chat(`/tp @s ${username}`);
      return;
    }
    
    bot.chat("Coming right to you!");
    bot.pathfinder.setGoal(new GoalFollow(playerEntity, 2), true); // Keep a 2-block tracking distance
    return;
  }

  if (msgLower === 'stop') {
    bot.chat("Stopping right here.");
    bot.pathfinder.setGoal(null);
    return;
  }

  // --- GEMINI AI CHAT BRAIN ---
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are playing Minecraft survival mode as an in-game bot character with your friend ${username}. You must speak like an energetic gamer and best friend. Keep all answers extremely short (1 to 2 simple sentences max) so it fits neatly in the Minecraft text box. Respond naturally to this message: ${message}`
    });

    if (response.text) {
      bot.chat(response.text);
    }
  } catch (err) {
    console.error("AI Generation Failed: ", err);
    bot.chat("My brain lag spiked... what did you say?");
  }
});

bot.on('end', () => {
  console.log("Disconnected. Reconnecting in 10 seconds...");
  setTimeout(() => process.exit(1), 10000);
});
