require('dotenv/config');
const { Client } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const client = new Client({
  intents: ['Guilds', 'GuildMembers', 'GuildMessages']
});

client.on('ready', () => {
  console.log('The bot is ready and now online');
});

const IGNORE_PREFIX = "!";
const CHANNELS = ['1172991646137319445']; // Your Channel ID

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Your Gemini API key
const model = genAI.getGenerativeModel({ model: "gemini-pro"});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith(IGNORE_PREFIX)) return;
  if (!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id)) return;

  await message.channel.sendTyping();

  const sendTypingInterval = setInterval(() => {
    message.channel.sendTyping();
  }, 5000);

  let chatHistory = []; // Gemini uses chat history instead of a messages array

  let prevMessages = await message.channel.messages.fetch({ limit: 10 });
  prevMessages.reverse();

  prevMessages.forEach((msg) => {
    if (msg.author.bot && msg.author.id !== client.user.id) return;
    if (msg.content.startsWith(IGNORE_PREFIX)) return;

    const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

     if (msg.author.id === client.user.id) {
        chatHistory.push({
          role: 'model',
          parts: msg.content,
        });
        return;
      }

      chatHistory.push({
        role: 'user',
        parts: msg.content,
      });
    });

  const chat = model.startChat({
    history:chatHistory,
     generationConfig: {
      maxOutputTokens: 800, // you can change this!
    },
  });

  const result = await chat.sendMessage(message.content);
  const response = await result.response;
  const responseMessage = response.text();

  clearInterval(sendTypingInterval);

  if (!responseMessage) {
    message.reply("Hello! Currently, I'm unavailable due to maintenance. I'll be back soon :)");
    return;
  }

  const chunkSizeLimit = 2000;

  for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
    const chunk = responseMessage.substring(i, i + chunkSizeLimit);
    await message.reply(chunk);
  }
});

client.login(process.env.TOKEN); // Bot token
