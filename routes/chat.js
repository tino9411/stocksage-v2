// routes/chat.js

const express = require('express');
const router = express.Router();
const Chat = require('../services/chat');
const User = require('../models/User');
const Thread = require('../models/Thread');
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

router.post('/create-thread', async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have user authentication middleware
    const threadId = await chat.createThread();
    
    const thread = new Thread({
      threadId: threadId,
      user: userId
    });
    await thread.save();

    await User.findByIdAndUpdate(userId, {
      $push: { threads: thread._id }
    });

    res.json({ threadId, message: "Thread created successfully" });
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({ error: "Failed to create thread", details: error.message });
  }
});

router.post('/stream/message', async (req, res) => {
  const { threadId, message } = req.body;
  const userId = req.user.id; // Assuming you have user authentication middleware

  try {
    const thread = await Thread.findOne({ threadId, user: userId });
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    storedMessage = { threadId, message };
    res.status(200).json({ message: "Message received", storedMessage });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: "Failed to process message", details: error.message });
  }
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
    await chat.streamMessage(storedMessage.threadId, storedMessage.message, async (event) => {
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
          // Save the completed message to the thread
          try {
            const thread = await Thread.findOne({ threadId: storedMessage.threadId });
            if (thread) {
              thread.messages.push({
                role: 'user',
                content: storedMessage.message
              });
              thread.messages.push({
                role: 'assistant',
                content: event.data.content
              });
              thread.updatedAt = Date.now();
              await thread.save();
            }
          } catch (error) {
            console.error('Error saving message to thread:', error);
          }
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

router.post('/upload', upload.array('files'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }
        
        const { threadId } = req.body;
        if (!threadId) {
            return res.status(400).json({ error: "Thread ID is required" });
        }

        const filePaths = req.files.map(file => {
            const originalName = file.originalname;
            const newPath = path.join(path.dirname(file.path), originalName);
            fs.renameSync(file.path, newPath);
            console.log(`File renamed: ${file.path} -> ${newPath}`);
            return newPath;
        });

        console.log(`Files to be uploaded: ${JSON.stringify(filePaths)}`);
        const uploadedFiles = await chat.addFilesToConversation(threadId, filePaths);
        res.json({ message: "Files uploaded successfully", files: uploadedFiles });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ error: "Failed to upload files", details: error.message });
    }
});

router.delete('/files/:threadId/:fileId', async (req, res) => {
  try {
    const { threadId, fileId } = req.params;
    const result = await chat.deleteFileFromConversation(threadId, fileId);
    res.json({ message: "File removed successfully", ...result });
  } catch (error) {
    console.error('Error removing file:', error);
    res.status(error.status || 500).json({ error: "Failed to remove file", details: error.message });
  }
});

router.post('/end', async (req, res) => {
    try {
        const { threadId } = req.body;
        if (!threadId) {
            return res.status(400).json({ error: "Thread ID is required" });
        }
        const logs = await chat.endConversation(threadId);
        res.json({ message: "Conversation ended successfully. Thread deleted.", logs });
    } catch (error) {
        console.error('Error ending conversation:', error);
        res.status(500).json({ error: "Failed to end conversation and delete resources" });
    }
});

router.get('/threads', async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have user authentication middleware
    const user = await User.findById(userId).populate('threads');
    res.json(user.threads);
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

router.get('/thread/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.id; // Assuming you have user authentication middleware

    const thread = await Thread.findOne({ threadId, user: userId });
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    res.json(thread);
  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).json({ error: "Failed to fetch thread" });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('Error in chat routes:', error);
    res.status(500).json({ error: error.message, logs: res.locals.logs });
});

module.exports = router;