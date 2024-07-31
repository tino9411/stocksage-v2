const express = require('express');
const router = express.Router();
const Stock = require('../services/StockService');
const expressWs = require('express-ws')(router);

// WebSocket route
router.ws('/realtime', (ws, req) => {
  console.log('New WebSocket connection established');

  ws.on('message', (msg) => {
    const { action, symbols } = JSON.parse(msg);
    
    if (action === 'subscribe') {
      symbols.forEach(symbol => {
        Stock.subscribe([symbol], (data) => {
          ws.send(JSON.stringify({ symbol, data }));
        });
      });
    } else if (action === 'unsubscribe') {
      symbols.forEach(symbol => {
        Stock.unsubscribe([symbol], () => {});
      });
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    // Unsubscribe from all symbols when the connection is closed
    Stock.unsubscribeAll(ws);
  });
});

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

// Get company profile
router.get('/:symbol/profile', async (req, res) => {
  try {
    const { symbol } = req.params;
    const profile = await Stock.fetchCompanyProfile(symbol);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching company profile', error: error.message });
  }
});

module.exports = router;