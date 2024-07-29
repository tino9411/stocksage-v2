//server.js
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const chatRouter = require('./routes/chat');
require('dotenv').config();
const connectDB = require('./config/db');
const executeService = require('./utils/serviceExecutor');
const Chat = require('./services/chat');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // Be more specific in production
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(compression());

app.use(express.json());

app.use((req, res, next) => {
  console.log('Headers before route handling:', res.getHeaders());
  next();
});

// Connect to MongoDB
connectDB();

// Create a chat instance
const chat = new Chat(process.env.OPENAI_API_KEY);

// Routes
const stockRoutes = require('./routes/stock');
app.use('/api/stocks', stockRoutes);

// Use the chat routes
app.use('/api/chat', chatRouter);

// Route for dynamic service execution
app.post('/api/executeService', async (req, res) => {
  const { serviceName, params } = req.body;
  try {
    const result = await executeService(serviceName, ...params);
    res.json(result);
  } catch (error) {
    console.error('Error executing service:', error);
    res.status(500).json({ error: error.message });
  }
});

/* // Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
}); */

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Graceful shutdown function
async function gracefulShutdown() {
  console.log('Shutting down gracefully...');
  // Delete the main assistant, all sub-assistants, and threads
  if (chat.mainAssistant) {
    console.log('Deleting assistants and threads...');
    await chat.endConversation();
  }
  // Close the server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  // If server hasn't finished in 10 seconds, shut down forcefully
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

// Listen for shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);