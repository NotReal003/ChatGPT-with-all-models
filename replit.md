# Discord ChatGPT Bot

## Overview
A Discord bot that uses OpenAI's GPT to respond to messages. The bot listens in specified channels and responds using the ChatGPT API.

## Project Structure
- `index.js` - Main bot code with Discord.js and OpenAI integration
- `package.json` - Node.js dependencies
- `.env.example` - Template for environment variables

## Environment Variables Required
- `TOKEN` - Discord bot token (from Discord Developer Portal)
- `OPENAI_API_KEY` - OpenAI API key for ChatGPT functionality

## Configuration
- `CHANNELS` array in index.js - Discord channel IDs where the bot will respond
- `IGNORE_PREFIX` - Messages starting with this prefix will be ignored (default: "!")

## Running the Bot
The bot runs on port 5000 with a simple Express server for status checks.

## Recent Changes
- Updated to use port 5000 and bind to 0.0.0.0 for Replit environment
- Added graceful handling for missing API keys
- Fixed OpenAI client initialization (apiKey case sensitivity)
