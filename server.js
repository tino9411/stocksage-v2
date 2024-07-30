const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const chatRouter = require('./routes/chat');
require('dotenv').config();
const connectDB = require('./config/db');
const executeService = require('./utils/serviceExecutor');
const Chat = require('./services/Chat');
const commandRoutes = require('./routes/command');
const Stock = require('./services/StockService');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*', // Be more specific in production
  methods: ['GET', 'POST', 'OPTIONS', 'DELETE'],
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
connectDB().then(() => {
  console.log('MongoDB connected successfully');
  // You can add default stocks to the watchlist here if needed
  // Stock.addDefaultStocks();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Create a chat instance
const chat = new Chat(process.env.OPENAI_API_KEY);

// Routes
const stockRoutes = require('./routes/stock');
app.use('/api/stocks', stockRoutes);
app.use('/api/chat', chatRouter);
app.use('/api/command', commandRoutes);

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

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    console.log('Received:', message);
    // Handle incoming messages if needed
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Initialize Stock service with WebSocket server
Stock.initializeWebSocket(wss);

server.listen(port, () => {
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

  // Close all WebSocket connections
  wss.clients.forEach((client) => {
    client.close();
  });

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

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

module.exports = { app, server, wss };