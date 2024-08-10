// routes/chat.js

const express = require('express');
const router = express.Router();
const MainAssistant = require('../assistants/MainAssistant');
const User = require('../models/User');
const Thread = require('../models/Thread');
require('dotenv').config();
const mainAssistant = new MainAssistant(process.env.OPENAI_API_KEY);
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Save the file with its original name, including the extension
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

let storedMessage = null;

router.post('/create-thread', async (req, res) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const metadata = {
            createdBy: userId,
            createdAt: new Date().toISOString(),
            // Add any other metadata you want to associate with the thread
        };

        const threadId = await mainAssistant.createThread({ 
            userId, 
            metadata
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
        mainAssistant.setCurrentThreadId(threadId);
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

    let assistantResponse = '';
    const currentStoredMessage = { ...storedMessage };

    try {
        console.log('Starting streamMessage');
        await mainAssistant.streamMessage(currentStoredMessage.threadId, currentStoredMessage.message, async (event) => {
            console.log('Received event:', event);
            switch (event.type) {
                case 'textDelta':
                    sendSSE('message', { type: 'textDelta', content: event.data.value });
                    assistantResponse += event.data.value;
                    break;
                case 'textCreated':
                    sendSSE('message', { type: 'textCreated', content: event.data.content[0].text.value });
                    assistantResponse = event.data.content[0].text.value;
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
        mainAssistant.clearCurrentThreadId();
    }
});

router.post('/upload', upload.array('files'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        console.log('Received files:', req.files); // Log the files array

        const { threadId } = req.body;
        if (!threadId) {
            return res.status(400).json({ error: "Thread ID is required" });
        }

        console.log(`Files to be uploaded: ${req.files.map(f => f.originalname).join(', ')}`);

        // Call the mainAssistant service to handle the file upload and vector store creation
        const result = await mainAssistant.addFilesToConversation(threadId, req.files);

        res.json({
            message: "Files uploaded and processed successfully",
            files: result
        });
    } catch (error) {
        console.error('Error uploading and processing files:', error);
        res.status(500).json({ error: "Failed to upload and process files", details: error.message });
    }
});

router.delete('/files/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const threadId = req.query.threadId; // Add this line to get the threadId from the query parameters

        if (!threadId) {
            return res.status(400).json({ error: "Thread ID is required" });
        }

        await mainAssistant.deleteFileFromConversation(threadId, fileId);
        res.json({ message: "File deleted successfully" });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: "Failed to delete file", details: error.message });
    }
});

router.post('/end', async (req, res) => {
    try {
        const { threadId } = req.body;
        if (!threadId) {
            return res.status(400).json({ error: "Thread ID is required" });
        }
        const userId = req.user.id;
        const result = await mainAssistant.endConversation(threadId, userId);

        res.json({ message: "Conversation ended successfully. Thread deleted.", ...result });
    } catch (error) {
        console.error('Error ending conversation:', error);
        res.status(500).json({ error: "Failed to end conversation and delete resources" });
    }
});

router.get('/threads', async (req, res) => {
    try {
        const userId = req.user.id; // Assuming you have user authentication middleware
        const user = await User.findById(userId).populate('threads');

        // Transform threads to include threadId explicitly
        const threads = user.threads.map(thread => ({
            threadId: thread.threadId, // Assuming you have a `threadId` field in your Thread model
            ...thread._doc
        }));

        res.json(threads);
    } catch (error) {
        console.error('Error fetching threads:', error);
        res.status(500).json({ error: "Failed to fetch threads" });
    }
});

// Fetch a single thread by threadId
router.get('/thread/:threadId', async (req, res) => {
    try {
        const { threadId } = req.params;
        const userId = req.user.id; // Assuming you have user authentication middleware

        // Find the thread by threadId
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

router.get('/thread/:threadId/messages', async (req, res) => {
    try {
      const { threadId } = req.params;
      const userId = req.user.id; // Assuming you have user authentication middleware
  
      // Find the thread by threadId and userId
      const thread = await Thread.findOne({ threadId, user: userId });
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }
  
      // Return the messages from the thread
      res.json(thread.messages);
    } catch (error) {
      console.error('Error fetching thread messages:', error);
      res.status(500).json({ error: "Failed to fetch thread messages" });
    }
  });
  

router.delete('/thread/:threadId', async (req, res) => {
    try {
        const { threadId } = req.params;
        const userId = req.user._id; // Get userId from the authenticated request

        if (!threadId) {
            return res.status(400).json({ error: "Thread ID is required" });
        }

        const result = await mainAssistant.endConversation(threadId, userId);

        if (!result.success) {
            return res.status(404).json({ error: result.message });
        }

        res.json({ message: result.message });
    } catch (error) {
        console.error('Error deleting thread:', error);
        res.status(500).json({ error: "Failed to delete thread and associated resources" });
    }
});

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('Error in chat routes:', error);
    res.status(500).json({ error: error.message, logs: res.locals.logs });
});

module.exports = router;