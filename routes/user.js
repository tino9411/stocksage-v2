const express = require('express');
const router = express.Router();
const UserService = require('../services/UserService');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Not authenticated' });
};

// Get user info
router.get('/', isAuthenticated, (req, res) => {
  res.json(req.user);
});

// Get user's watchlist
router.get('/watchlist', isAuthenticated, async (req, res) => {
  try {
    const watchlistWithQuotes = await UserService.getWatchlistWithQuotes(req.user.id);
    res.json(watchlistWithQuotes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching watchlist', error: error.message });
  }
});

// Add stock to user's watchlist
router.post('/watchlist', isAuthenticated, async (req, res) => {
  try {
    const { symbol } = req.body;
    const updatedWatchlist = await UserService.addToWatchlist(req.user.id, symbol);
    res.json(updatedWatchlist);
  } catch (error) {
    res.status(500).json({ message: 'Error adding stock to watchlist', error: error.message });
  }
});

// Remove stock from user's watchlist
router.delete('/watchlist/:symbol', isAuthenticated, async (req, res) => {
  try {
    const { symbol } = req.params;
    const updatedWatchlist = await UserService.removeFromWatchlist(req.user.id, symbol);
    res.json(updatedWatchlist);
  } catch (error) {
    res.status(500).json({ message: 'Error removing stock from watchlist', error: error.message });
  }
});

module.exports = router;