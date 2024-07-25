const express = require('express');
const cors = require('cors');
const path = require('path');
const chatRouter = require('./routes/chat');
require('dotenv').config();

const connectDB = require('./config/db');
const executeService = require('./utils/serviceExecutor');  // Import the service executor

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

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
        res.status(500).json({ error: error.message });
    }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});