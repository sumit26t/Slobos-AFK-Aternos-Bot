const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalFollow = goals.GoalFollow;
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini AI (Reads GEMINI_API_KEY safely from Railway environment variables)
const ai = new GoogleGenAI({});

// 1. Create the Minecraft Bot Connection
const bot = mineflayer.createBot({
  host: 'yourserver.aternos.me',  // <--- CHANGE THIS to your Aternos server IP!
  port: 25565,                   // <--- CHANGE THIS to your Aternos port if different
  username: 'SloboAI_Friend',    // Your bot's in-game name
  auth: 'offline'                // Crucial for Aternos Cracked mode
});

// Load the pathfinder leg mechanics
bot.loadPlugin(pathfinder);

bot.on('spawn', () => {
  console.log(`${bot.username} joined the server! ready to hang out!`);
});

// 2. Continuous Chat and Logic Listener
bot.on('chat', async (username, message) => {
  // Prevent the bot from replying to itself
  if (username === bot.username) return;

  const msgLower = message.toLowerCase();
  const playerEntity = bot.players[username]?.entity;

  // --- COMPANION ACTIONS ---
  if (msgLower === 'come here' || msgLower === 'follow me') {
    if (!playerEntity) {
      bot.chat("I can't see you! Get closer to me so I can track your position.");
      return;
    }
    bot.chat("Coming right to you!");
    const movements = new Movements(bot);
    bot.pathfinder.setMovements(movements);
    bot.pathfinder.setGoal(new GoalFollow(playerEntity, 2), true); // Keep a 2-block distance
    return;
  }

  if (msgLower === 'stop') {
    bot.chat("Staying right here.");
    bot.pathfinder.setGoal(null);
    return;
  }

  // --- GEMINI AI TALKING VOICE ---
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
    bot.chat("My brain lag spiked for a second... what did you say?");
  }
});

// Automatically handle disconnections or server restarts
bot.on('end', () => {
  console.log("Disconnected from server. Reconnecting in 10 seconds...");
  setTimeout(() => process.exit(1), 10000); // Exiting kills the container, forcing Railway to deploy a fresh, clean connection
});
