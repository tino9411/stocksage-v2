// routes/command.js
const express = require('express');
const router = express.Router();
const Command = require('../services/Command');

const commandService = new Command(process.env.OPENAI_API_KEY);

router.post('/execute', async (req, res) => {
    try {
        const { command } = req.body;
        if (!command) {
            return res.status(400).json({ error: 'Command is required' });
        }

        const result = await commandService.handleCommand(command);
        res.json({ result });
    } catch (error) {
        console.error('Error executing command:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;