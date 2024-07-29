const express = require('express');
const router = express.Router();
const Chat = require('../services/chat');
require('dotenv').config();

const chat = new Chat(process.env.OPENAI_API_KEY);

// Helper function to process assistant response
function processAssistantResponse(text) {
    let processed = text.replace(/`([^`\n]+)`/g, '§§§$1§§§');
    processed = processed.replace(/```([\s\S]*?)```/g, '£££$1£££');
    processed = processed.replace(/§§§/g, '`');
    processed = processed.replace(/£££/g, '```');
    return processed;
}

let storedMessage = null;

router.post('/initialize', async (req, res) => {
  try {
    const logs = await chat.initializeAssistant({
      model: "gpt-4o-mini",
      name: "Stock Analysis Assistant"
    });
    res.json({ message: "Assistant initialized successfully", logs });
  } catch (error) {
    console.error('Error initializing assistant:', error);
    res.status(500).json({ error: "Failed to initialize assistant" });
  }
});

router.post('/start', async (req, res) => {
  try {
    const { message } = req.body;
    const { message: response, logs } = await chat.startConversation(message);
    const processedResponse = processAssistantResponse(response);
    res.json({ message: processedResponse, logs });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ error: "Failed to start conversation" });
  }
});

router.post('/stream/message', (req, res) => {
  storedMessage = req.body.message;
  res.status(200).json({ message: "Message received", storedMessage });
});

router.get('/stream', async (req, res) => {
  if (!storedMessage) {
    return res.status(400).json({ error: "No message stored" });
  }

  console.log('Received request on /stream with stored message:', storedMessage);

  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    console.log('SSE headers set');

    const sendSSE = (event, data) => {
      console.log(`Sending event: ${event} with data:`, data);
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      res.flush(); // Ensure the data is sent immediately

    };

    const keepAlive = setInterval(() => {
      sendSSE('ping', {});
    }, 15000);

    console.log('Starting streamMessage');
    await chat.streamMessage(storedMessage, (event) => {
      console.log('Received event:', event);
      if (event.type === 'textDelta') {
        sendSSE('message', { type: 'textDelta', content: event.data });
      } else if (event.type === 'end') {
        sendSSE('end', { content: 'Stream ended' });
        clearInterval(keepAlive);
        res.end();
      }
    });
  } catch (error) {
    console.error('Error streaming message:', error);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.write(`<html><body><h1>500 Internal Server Error</h1><p>${error.message}</p></body></html>`);
    res.end();
  } finally {
    storedMessage = null; // Clear the stored message after streaming
  }
});

router.post('/end', async (req, res) => {
  try {
    const logs = await chat.endConversation();
    res.json({ message: "Conversation ended successfully. All assistants and threads deleted.", logs });
  } catch (error) {
    console.error('Error ending conversation:', error);
    res.status(500).json({ error: "Failed to end conversation and delete resources" });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('Error in chat routes:', error);
    res.status(500).json({ error: error.message, logs: res.locals.logs });
});

module.exports = router;