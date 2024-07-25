const express = require('express');
const Stock = require('../models/Stock');

const router = express.Router();

// Example GET route to fetch all stocks
router.get('/', async (req, res) => {
    try {
        const stock = await Stock.find();
        res.json(stock);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Example POST route to create a new stock
router.post('/', async (req, res) => {
    const newStock = new Stock(req.body);
    try {
        const savedStock = await newStock.save();
        res.status(201).json(savedStock);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;