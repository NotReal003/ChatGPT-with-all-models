require('dotenv/config');
const { Client } = require('discord.js');
const { OpenAI } = require('openai');
const express = require("express");

const client = new Client({
  intents: ['Guilds', 'GuildMembers', 'GuildMessages']
});

client.on('ready', () => {
  console.log('the bot is ready and now online');
});

const app = express();  
const port = 5000;
app.get('/', (req, res) => {
  const tokenStatus = process.env.TOKEN ? 'configured' : 'missing';
  const openaiStatus = process.env.OPENAI_API_KEY ? 'configured' : 'missing';
  res.send(`Discord Bot Status: Running<br>Discord Token: ${tokenStatus}<br>OpenAI API Key: ${openaiStatus}`);
});
app.listen(port, '0.0.0.0', () => console.log('\x1b[36m%s\x1b[0m', `|    🔗 Listening on port: ${port}`));  

const IGNORE_PREFIX = "!";
const CHANNELS = ['1172991646137319445'];

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith(IGNORE_PREFIX)) return;
  if (!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id)) return;

  if (!openai) {
    message.reply("OpenAI is not configured. Please set the OPENAI_API_KEY environment variable.");
    return;
  }

  await message.channel.sendTyping();

  const sendTypingInterval = setInterval(() => {
    message.channel.sendTyping();
  }, 5000);

  let conversation = [];
  conversation.push({
    role: 'system',
    content: 'ChatGPT is a friendly chatbot.'
  });

  let prevMessages = await message.channel.messages.fetch({ limit: 10 });
  prevMessages.reverse();

  prevMessages.forEach((msg) => {
    if (msg.author.bot && msg.author.id !== client.user.id) return;
    if (msg.content.startsWith(IGNORE_PREFIX)) return;

    const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

    if (msg.author.id === client.user.id) {
      conversation.push({
        role: 'assistant',
        name: username,
        content: msg.content,
      });

      return;
    }

    conversation.push({
      role: 'user',
      name: username,
      content: msg.content,
    });
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: conversation,
  })
    .catch((error) => console.error('OpenAi Error:\n', error));

  clearInterval(sendTypingInterval);

  if (!response) {
    message.reply("Hello! I'm currently unavailable due to maintenance. Will be back soon :)");
    return;
  }

  const responseMessage = response.choices[0].message.content;
  const chunkSizeLimit = 2000;

  for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
    const chunk = responseMessage.substring(i, i + chunkSizeLimit);
    await message.reply(chunk);
  } 
});

if (process.env.TOKEN) {
  client.login(process.env.TOKEN);
} else {
  console.log('Warning: Discord TOKEN is not set. Bot will not connect to Discord.');
}
