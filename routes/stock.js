const express = require('express');
const router = express.Router();
const Stock = require('../services/StockService');

// Search for stocks
router.get('/search', async (req, res) => {
  try {
    const { query, limit } = req.query;
    const results = await Stock.searchStocks(query, limit);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error searching stocks', error: error.message });
  }
});

// Add stock to watchlist
router.post('/watchlist', async (req, res) => {
  try {
    const { symbol } = req.body;
    const stock = await Stock.addToWatchlist(symbol);
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: 'Error adding stock to watchlist', error: error.message });
  }
});

// Get watchlist
router.get('/watchlist', async (req, res) => {
    try {
      const watchlist = await Stock.getWatchlist();
      res.json(watchlist);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching watchlist', error: error.message });
    }
  });

// Remove stock from watchlist
router.delete('/watchlist/:symbol', (req, res) => {
  const { symbol } = req.params;
  Stock.removeFromWatchlist(symbol);
  res.json({ message: 'Stock removed from watchlist' });
});

// Get historical data for a stock
router.get('/:symbol/historical', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { from, to } = req.query;
    const historicalData = await Stock.fetchHistoricalData(symbol, from, to);
    res.json(historicalData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching historical data', error: error.message });
  }
});

// Get financial statements for a stock
router.get('/:symbol/financials', async (req, res) => {
  try {
    const { symbol } = req.params;
    const financials = await Stock.fetchFinancialStatements(symbol);
    res.json(financials);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching financial statements', error: error.message });
  }
});

module.exports = router;