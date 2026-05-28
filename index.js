const mineflayer = require('mineflayer');
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini AI
const ai = new GoogleGenAI({});

// Create the Minecraft Bot Connection
const bot = mineflayer.createBot({
  host: 'Heronrinesmp.aternos.me',  // <--- Keep your real Aternos IP here!
  port: 42139,                   
  username: 'SloboAI_Friend',    
  auth: 'offline',               
  version: '1.21.4'              // <--- Keep your Minecraft version here!
});

let followInterval = null;

bot.on('spawn', () => {
  console.log(`${bot.username} is fully connected and stable!`);
});

// Chat and AI Command Listener
bot.on('chat', async (username, message) => {
  if (username === bot.username) return;

  const msgLower = message.toLowerCase();

  // --- EASY FOLLOW COMMAND ---
  if (msgLower === 'come here' || msgLower === 'follow me') {
    bot.chat(`On my way to you, ${username}!`);
    
    // Clear any old loops if running
    if (followInterval) clearInterval(followInterval);
    
    // Light-weight follow: Teleports the bot to your feet smoothly every 2 seconds
    followInterval = setInterval(() => {
      bot.chat(`/tp @s ${username}`);
    }, 2000);
    return;
  }

  // --- STOP COMMAND ---
  if (msgLower === 'stop') {
    bot.chat("Stopping right here.");
    if (followInterval) {
      clearInterval(followInterval);
      followInterval = null;
    }
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
  }
});

bot.on('end', () => {
  if (followInterval) clearInterval(followInterval);
  console.log("Disconnected. Reconnecting...");
  setTimeout(() => process.exit(1), 5000);
});
