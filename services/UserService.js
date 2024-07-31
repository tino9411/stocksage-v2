const axios = require('axios');
const User = require('../models/User');
const Stock = require('../models/Stock');
const { fetchRealTimeQuote } = require('../tools/fetchRealTimeQuote');
const { fetchCompanyProfile } = require('../tools/fetchCompanyProfile');

class UserService {
  async findOrCreateUser(profile) {
    const existingUser = await User.findOne({ googleId: profile.id });
    if (existingUser) {
      return existingUser;
    }

    const newUser = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      watchlist: []
    });

    return await newUser.save();
  }

  async addToWatchlist(userId, symbol) {
    // Fetch and save the company profile
    await fetchCompanyProfile(symbol);

    // Add the symbol to the user's watchlist
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { watchlist: symbol } },
      { new: true }
    );

    return await this.getWatchlistWithQuotes(userId);
  }

  async removeFromWatchlist(userId, symbol) {
    await User.findByIdAndUpdate(
      userId,
      { $pull: { watchlist: symbol } },
      { new: true }
    );

    return await this.getWatchlistWithQuotes(userId);
  }

  async getWatchlist(userId) {
    const user = await User.findById(userId);
    return user ? user.watchlist : [];
  }

  async getWatchlistWithQuotes(userId) {
  const user = await User.findById(userId);
  if (!user) return [];

  const watchlistQuotes = await Promise.all(
    user.watchlist.map(async (symbol) => {
      const realTimeQuote = await fetchRealTimeQuote(symbol);
      const companyProfile = await Stock.findOne({ symbol: symbol }); // Fetch company profile from database
      return {
        symbol: symbol,
        companyName: companyProfile ? companyProfile.companyName : 'Unknown Company', // Include company name
        ...realTimeQuote
      };
    })
  );

  return watchlistQuotes.filter(stock => stock.price !== null && stock.price !== undefined);
}
}

module.exports = new UserService();