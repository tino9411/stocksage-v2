const express = require('express');
const router = express.Router();
const Chat = require('../services/chat');
require('dotenv').config();
const chat = new Chat(process.env.OPENAI_API_KEY);
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const path = require('path');
const fs = require('fs');


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
            name: "Main Stock Analysis Assistant"
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

router.post('/upload', upload.array('files'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }
        
        const filePaths = req.files.map(file => {
            const originalName = file.originalname;
            const newPath = path.join(path.dirname(file.path), originalName);
            fs.renameSync(file.path, newPath);
            console.log(`File renamed: ${file.path} -> ${newPath}`);
            return newPath;
        });

        console.log(`Files to be uploaded: ${JSON.stringify(filePaths)}`);
        const uploadedFiles = await chat.addFilesToConversation(filePaths);
        res.json({ message: "Files uploaded successfully", files: uploadedFiles });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ error: "Failed to upload files", details: error.message });
    }
});

router.delete('/files/:fileId', async (req, res) => {
  try {
      const { fileId } = req.params;
      const vectorStoreId = await chat.mainAssistant.getVectorStoreIdForThread(chat.threadId);
      
      if (!vectorStoreId) {
          throw new Error('No vector store found for this conversation');
      }

      await chat.mainAssistant.deleteFileFromConversation(fileId, vectorStoreId);
      res.json({ message: "File removed successfully" });
  } catch (error) {
      console.error('Error removing file:', error);
      res.status(error.status || 500).json({ error: "Failed to remove file", details: error.message });
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
      res.flush();
  };

  const keepAlive = setInterval(() => {
      sendSSE('ping', {});
  }, 15000);

  try {
      console.log('Starting streamMessage');
      await chat.streamMessage(storedMessage, (event) => {
          console.log('Received event:', event);
          switch (event.type) {
              case 'textDelta':
                  sendSSE('message', { type: 'textDelta', content: event.data.value });
                  break;
              case 'textCreated':
                  sendSSE('message', { type: 'textCreated', content: event.data.content[0].text.value });
                  break;
              case 'requiresAction':
                  sendSSE('requiresAction', { toolCalls: event.data });
                  break;
              case 'end':
                  sendSSE('end', { content: 'Stream ended' });
                  clearInterval(keepAlive);
                  res.end();
                  break;
              case 'error':
                  sendSSE('error', { content: event.data });
                  clearInterval(keepAlive);
                  res.end();
                  break;
          }
      });
  } catch (error) {
      console.error('Error streaming message:', error);
      sendSSE('error', { content: error.message });
      clearInterval(keepAlive);
      res.end();
  } finally {
      storedMessage = null;
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