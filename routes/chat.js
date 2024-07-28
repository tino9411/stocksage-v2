//routes/chat.js
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

// Helper function to capture logs
function captureLogs(operation) {
    const logs = [];
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = (...args) => {
        logs.push(args.join(' '));
        originalConsoleLog(...args);
    };
    console.error = (...args) => {
        logs.push(`ERROR: ${args.join(' ')}`);
        originalConsoleError(...args);
    };

    return async (req, res, next) => {
        try {
            await operation(req, res);
            console.log = originalConsoleLog;
            console.error = originalConsoleError;
            res.locals.logs = logs;
            next();
        } catch (error) {
            console.log = originalConsoleLog;
            console.error = originalConsoleError;
            res.locals.logs = logs;
            next(error);
        }
    };
}

const safeStringify = (obj) => {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return '[Circular]';
      }
      cache.add(value);
    }
    return value;
  });
};


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

router.post('/message', async (req, res) => {
  try {
    const { message } = req.body;
    const { message: response, logs } = await chat.sendMessage(message);
    const processedResponse = processAssistantResponse(response);
    res.json({ message: processedResponse, logs });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.post('/stream', async (req, res) => {
  const { message } = req.body;
  console.log('[/stream] Received message:', message);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  let fullResponse = '';

  try {
    console.log('[/stream] Starting streamMessage');
    await chat.streamMessage(message, (event) => {
      console.log('[/stream] Received event:', event);
      if (event.type === 'textDelta') {
        fullResponse += event.data;
        console.log('[/stream] Sending textDelta:', event.data);
        res.write(`data: ${JSON.stringify({ type: 'textDelta', content: event.data })}\n\n`);
      } else if (event.type === 'error') {
        console.log('[/stream] Sending error:', event.data);
        res.write(`data: ${JSON.stringify({ type: 'error', content: event.data })}\n\n`);
      } else if (event.type === 'end') {
        console.log('[/stream] Sending end event. Full response:', fullResponse);
        res.write(`data: ${JSON.stringify({ type: 'end', content: fullResponse })}\n\n`);
        res.end();
      } else {
        console.log('[/stream] Sending other event:', event);
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    });
  } catch (error) {
    console.error('[/stream] Error streaming message:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', content: error.message })}\n\n`);
    res.end();
  }
});

router.get('/stream', async (req, res) => {
  const { message } = req.query;
  console.log('[/stream] Received message:', message);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  let fullResponse = '';

  try {
    console.log('[/stream] Starting streamMessage');
    await chat.streamMessage(message, (event) => {
      console.log('[/stream] Received event:', event);
      if (event.type === 'textDelta') {
        fullResponse += event.data;
        console.log('[/stream] Sending textDelta:', event.data);
        res.write(`data: ${JSON.stringify({ type: 'textDelta', content: event.data })}\n\n`);
      } else if (event.type === 'error') {
        console.log('[/stream] Sending error:', event.data);
        res.write(`data: ${JSON.stringify({ type: 'error', content: event.data })}\n\n`);
      } else if (event.type === 'end') {
        console.log('[/stream] Sending end event. Full response:', fullResponse);
        res.write(`data: ${JSON.stringify({ type: 'end', content: fullResponse })}\n\n`);
        res.end();
      } else {
        console.log('[/stream] Sending other event:', event);
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    });
  } catch (error) {
    console.error('[/stream] Error streaming message:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', content: error.message })}\n\n`);
    res.end();
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