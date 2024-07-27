//routes/chat.js
const express = require('express');
const router = express.Router();
const Chat = require('../services/chat');
require('dotenv').config();

const chat = new Chat(process.env.OPENAI_API_KEY);

function processAssistantResponse(text) {
    // Replace single backticks with a special marker
    let processed = text.replace(/`([^`\n]+)`/g, '§§§$1§§§');
    
    // Replace triple backticks with a different marker
    processed = processed.replace(/```([\s\S]*?)```/g, '£££$1£££');
    
    // Now replace the markers with proper Markdown syntax
    processed = processed.replace(/§§§/g, '`');
    processed = processed.replace(/£££/g, '```');
    
    return processed;
  }

  router.post('/initialize', async (req, res) => {
    try {
        await chat.initializeAssistant({
            model: "gpt-4o-mini",
            name: "Stock Analysis Assistant"
        });
        res.json({ message: "Assistant initialized successfully" });
    } catch (error) {
        console.error('Error initializing assistant:', error);
        res.status(500).json({ error: "Failed to initialize assistant" });
    }
});

router.post('/start', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await chat.startConversation(message);
    const processedResponse = processAssistantResponse(response);
    res.json({ message: processedResponse });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ error: "Failed to start conversation" });
  }
});

router.post('/message', async (req, res) => {
    try {
        const { message } = req.body;
        const response = await chat.sendMessage(message);
        const processedResponse = processAssistantResponse(response);
        res.json({ message: processedResponse });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: "Failed to send message" });
    }
});

router.post('/end', async (req, res) => {
    try {
        await chat.endConversation();
        res.json({ message: "Conversation ended successfully" });
    } catch (error) {
        console.error('Error ending conversation:', error);
        res.status(500).json({ error: "Failed to end conversation" });
    }
});

module.exports = router;