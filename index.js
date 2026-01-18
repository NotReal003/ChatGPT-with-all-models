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

const express = require('express');  
const app = express();  
const port = 3000; // or any port of your choice.  
app.get('/', (req, res) => res.send('Hello World!'));  
app.listen(port, () => console.log('\x1b[36m%s\x1b[0m', `|    🔗 Listening to RTX : ${port}`));  

const IGNORE_PREFIX = "!";
const CHANNELS = ['1172991646137319445'];//your Channel id

  const openai = new OpenAI({
  apikey: process.env.OPENAI_API_KEY,// your openai api key
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith(IGNORE_PREFIX)) return;
  if (!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id)) return;

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
  })

const response = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo', // you can change to whatever you want! like gpt-4
  messages: conversation,
})
  .catch((error) => console.error('OpenAi Error:\n', error));

 clearInterval(sendTypingInterval);

  if (!response) {
    message.reply("Hello! correctly I'm unavailable means I'm under maintenance, will be back soon :)");
    return;
  }

  const responseMessage = response.choices[0].message.content;
  const chunkSizeLimit = 2000;

  for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
    const chunk = responseMessage.substring(i, i + chunkSizeLimit);

    await message.reply(chunk);
  } 
});

client.login(process.env.TOKEN);// bot token
