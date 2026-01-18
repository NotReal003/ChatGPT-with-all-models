require('dotenv/config');
const { Client } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require("express");

const client = new Client({
  intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent']
});

client.on('ready', () => {
  console.log('Sentralia Bot is online!');
});

// --- Health Check Server ---
const app = express();
const port = 5000;
app.get('/', (req, res) => {
  res.send(`Sentralia Bot Status: Running`);
});
app.listen(port, '0.0.0.0', () => console.log(`|    🔗 Listening on port: ${port}`));

// --- Configuration ---
const IGNORE_PREFIX = "!";
const CHANNELS = ['1172991646137319445'];

// --- Gemini Setup ---
let genAI = null;
let model = null;

// UPDATED: More conversational instructions
const SENTRALIA_CONTEXT = `
You are a helpful, casual, and savvy AI assistant for the Sentralia community. You are chatting with developers and users in a Discord server.

**Your Personality:**
- Be conversational and concise. Do NOT dump a wall of text unless specifically asked for details.
- Avoid sounding like a marketing brochure or a script. 
- If the user asks "What is Sentralia?", give a short, punchy summary (1-2 sentences). Only go into pricing/tech stack if they ask for more.
- Be friendly but professional.

**Knowledge Base (Reference Only - Do not recite this list):**
- **What is it?** Sentralia is a self-hosted request management system (MERN stack) created by NotReal003.
- **Why it exists:** To replace expensive SaaS subscriptions. You buy the source code, you own it forever.
- **Tech:** React, Node.js, Express, MongoDB.
- **Pricing:** $29 (Personal), $79 (Developer/Commercial).
- **Website:** https://sentralia.notreal003.org
`;

if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ 
    model: "gemini-3-flash-preview", 
    systemInstruction: SENTRALIA_CONTEXT
  });
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith(IGNORE_PREFIX)) return;
  if (!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id)) return;

  if (!model) return;

  await message.channel.sendTyping();

  try {
    // 1. Fetch History
    let prevMessages = await message.channel.messages.fetch({ limit: 10 });
    prevMessages = Array.from(prevMessages.values()).reverse();

    const history = [];
    for (const msg of prevMessages) {
      if (msg.id === message.id) continue;
      if (msg.content.startsWith(IGNORE_PREFIX)) continue;

      const role = (msg.author.id === client.user.id) ? 'model' : 'user';
      // Include username so the bot knows who is talking
      const text = (role === 'user') ? `${msg.author.username}: ${msg.content}` : msg.content;

      if (history.length > 0 && history[history.length - 1].role === role) {
        history[history.length - 1].parts[0].text += `\n${text}`;
      } else {
        history.push({ role, parts: [{ text }] });
      }
    }

    // Clean start of history
    while (history.length > 0 && history[0].role === 'model') {
      history.shift();
    }

    // 2. Chat
    const chat = model.startChat({
      history: history,
      generationConfig: { maxOutputTokens: 1000 }, // Lower token limit encourages brevity
    });

    const result = await chat.sendMessage(`${message.author.username}: ${message.content}`);
    const responseMessage = result.response.text();

    // 3. Send
    const chunkSizeLimit = 2000;
    for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
      await message.reply(responseMessage.substring(i, i + chunkSizeLimit));
    }

  } catch (error) {
    console.error('Gemini Error:', error);
  }
});

if (process.env.TOKEN) {
  client.login(process.env.TOKEN);
} else {
  console.log('No Token');
}
