const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalFollow = goals.GoalFollow;
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini AI
const ai = new GoogleGenAI({});

// Create the Minecraft Bot Connection
const bot = mineflayer.createBot({
  host: 'yourserver.aternos.me',  // <--- Keep your real Aternos IP here!
  port: 25565,                   
  username: 'SloboAI_Friend',    
  auth: 'offline',               
  version: '1.21.4'              // <--- Keep your Minecraft version here!
});

bot.loadPlugin(pathfinder);

bot.on('spawn', () => {
  console.log(`${bot.username} is ready to play!`);
  
  // Set up light-weight movement maps to handle natural block-walking
  const mcData = require('minecraft-data')(bot.version);
  const movements = new Movements(bot, mcData);
  movements.canDig = false; // Prevents RAM-heavy block breaking math
  bot.pathfinder.setMovements(movements);
});

// Natural Human Behavior: Make the bot look at the closest player naturally
setInterval(() => {
  const playerFilter = (entity) => entity.type === 'player';
  const playerEntity = bot.nearestEntity(playerFilter);
  if (playerEntity) {
    bot.lookAt(playerEntity.position.offset(0, 1.6, 0)); // Look at eye level
  }
}, 500);

// Chat & Brain Logic
bot.on('chat', async (username, message) => {
  if (username === bot.username) return;

  const msgLower = message.toLowerCase();
  const playerEntity = bot.players[username]?.entity;

    // --- NATURAL SMOOTH FOLLOW ---
  if (msgLower === 'come here' || msgLower === 'follow me' || msgLower === 'chalo') {
    bot.chat(`I'm on my way, ${username}! Let's explore together.`);
    
    if (followInterval) clearInterval(followInterval);
    
    // This moves the bot seamlessly toward your coordinate position without hitting you
    followInterval = setInterval(() => {
      const target = bot.players[username]?.entity;
      if (target) {
        // Move toward the player smoothly if they are further than 3 blocks away
        const dist = bot.entity.position.distanceTo(target.position);
        if (dist > 3) {
          bot.chat(`/execute as @s run tp @s ~ ~ ~ facing entity ${username}`);
          bot.chat(`/tp @s ^ ^ ^0.4`); // Walks forward smoothly 0.4 blocks toward you
        }
      }
    }, 250); // Updates smoothly every quarter of a second
    return;
  }
  
  // --- EMERGENCY TELEPORT (If stuck in a cave/hole) ---
  if (msgLower === 'tp' || msgLower === 'teleport') {
    bot.chat("Snapping to your location!");
    bot.chat(`/tp @s ${username}`);
    bot.pathfinder.setGoal(null);
    return;
  }

  // --- STOP WALKING ---
  if (msgLower === 'stop' || msgLower === 'ruk jao') {
    bot.chat("Standing guard right here.");
    bot.pathfinder.setGoal(null);
    return;
  }

  // --- GEMINI TALKING BRAIN ---
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are playing Minecraft survival mode as an active in-game player character with your best friend ${username}. You must speak exactly like an enthusiastic, funny gamer and supportive best friend playing alongside them. Answer the following chat message naturally, keeping your reply to 1 or 2 friendly sentences max: ${message}`
    });

    if (response.text) {
      bot.chat(response.text);
    }
  } catch (err) {
    console.error("AI Error: ", err);
  }
});

bot.on('end', () => {
  console.log("Reconnecting container...");
  setTimeout(() => process.exit(1), 5000);
});
