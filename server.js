require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport');
const chatRouter = require('./routes/chat');
const stockRoutes = require('./routes/stock');
const userRoutes = require('./routes/user');
const connectDB = require('./config/db');
const executeService = require('./utils/serviceExecutor');
const Chat = require('./services/Chat');
const commandRoutes = require('./routes/command');
const Stock = require('./services/StockService');

const app = express();

// Create server with increased header size limit
const server = http.createServer({
  maxHeaderSize: 32768  // Increase max header size to 32KB
}, app);

const wss = new WebSocket.Server({ server });
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));

app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Add header logging middleware
app.use((req, res, next) => {
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  next();
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
connectDB().then(() => {
  console.log('MongoDB connected successfully');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Create a chat instance
const chat = new Chat(process.env.OPENAI_API_KEY);

// Routes
app.use('/api/stocks', stockRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRouter);
app.use('/api/command', commandRoutes);

// Auth routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );
  
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/auth/callback`);
  }
);

// Route to check authentication status
app.get('/api/auth/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ isAuthenticated: true, user: req.user });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// Logout route
app.get('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out', error: err });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

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
  if (chat.mainAssistant) {
    console.log('Deleting assistants and threads...');
    await chat.endConversation();
  }
  wss.clients.forEach((client) => {
    client.close();
  });
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { app, server, wss };