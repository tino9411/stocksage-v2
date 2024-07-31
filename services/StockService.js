const axios = require('axios');
const WebSocket = require('ws');
const Stock = require('../models/Stock');
const { fetchRealTimeQuote } = require('../tools/fetchRealTimeQuote');

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

class StockService {
  constructor() {
    this.wss = null;
    this.watchlist = new Set();
  }

  initializeWebSocket() {
    this.ws = new WebSocket('wss://websockets.financialmodelingprep.com');

    this.ws.on('open', () => {
      console.log('WebSocket connection established');
      const loginMessage = JSON.stringify({
        event: 'login',
        data: { apiKey: process.env.FMP_API_KEY }
      });
      this.ws.send(loginMessage);

      // Subscribe to all stocks in the watchlist
      if (this.watchlist.size > 0) {
        this.subscribeToRealTimeQuotes(Array.from(this.watchlist));
      }
    });

    this.ws.on('message', (data) => {
      const quote = JSON.parse(data);
      if (quote.type === 'T' || quote.type === 'Q') {
        this.updateStockPrice(quote);
      }
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.ws.on('close', () => {
      console.log('WebSocket connection closed');
      // Attempt to reconnect after a delay
      setTimeout(() => this.initializeWebSocket(), 5000);
    });
  }

  broadcastUpdate(data) {
    if (this.wss) {
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }
  }

  async searchStocks(query, limit = 10) {
    try {
      const response = await axios.get(`${FMP_BASE_URL}/search?query=${query}&limit=${limit}&apikey=${FMP_API_KEY}`);
      return response.data;
    } catch (error) {
      console.error('Error searching stocks:', error);
      throw error;
    }
  }

  async addToWatchlist(symbol) {
    try {
      let stock = await this.fetchCompanyProfile(symbol);
      if (!stock) {
        throw new Error('Stock not found');
      }
      this.watchlist.add(symbol);
      this.subscribeToRealTimeQuotes([symbol]);
      return stock;
    } catch (error) {
      console.error('Error adding stock to watchlist:', error);
      throw error;
    }
  }

  async getWatchlist() {
    try {
      const watchlistStocks = await Promise.all(
        Array.from(this.watchlist).map(async (symbol) => {
          const stock = await Stock.findOne({ symbol });
          if (stock) {
            const realTimeQuote = await fetchRealTimeQuote(symbol);
            return {
              symbol: stock.symbol,
              companyName: stock.companyName,
              ...realTimeQuote
            };
          }
          return null;
        })
      );
      return watchlistStocks.filter(stock => stock !== null);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      return [];
    }
  }

  removeFromWatchlist(symbol) {
    this.watchlist.delete(symbol);
    // Unsubscribe from real-time quotes for this symbol if needed
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const unsubscribeMessage = JSON.stringify({
        event: 'unsubscribe',
        data: { ticker: symbol }
      });
      this.ws.send(unsubscribeMessage);
    }
  }

  async fetchCompanyProfile(symbol) {
    try {
      let stock = await Stock.findOne({ symbol });
      if (stock) {
        return stock;
      }

      const profileUrl = `${FMP_BASE_URL}/profile/${symbol}?apikey=${FMP_API_KEY}`;
      const realTimeQuote = await fetchRealTimeQuote(symbol);
      
      const profileResponse = await axios.get(profileUrl);
      const profileData = profileResponse.data[0];

      if (!profileData) {
        return null;
      }

      stock = new Stock({
        symbol: profileData.symbol,
        companyName: profileData.companyName,
        ...realTimeQuote,
        // Add other fields from profileData as needed
      });

      await stock.save();
      return stock;
    } catch (error) {
      console.error(`Error fetching company profile for ${symbol}:`, error);
      throw error;
    }
  }

  subscribeToRealTimeQuotes(symbols) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not connected. Initializing connection...');
      this.initializeWebSocket();
      return;
    }

    const subscribeMessage = JSON.stringify({
      event: 'subscribe',
      data: { ticker: symbols }
    });
    this.ws.send(subscribeMessage);
    console.log(`Subscribed to real-time quotes for: ${symbols.join(', ')}`);
  }

  async updateStockPrice(quote) {
    try {
      if (!quote || !quote.s) {
        console.error('Invalid quote received:', quote);
        return;
      }
      console.log(`Updating stock price for ${quote.s}`);
      const price = quote.type === 'T' ? quote.lp : (quote.ap + quote.bp) / 2;
      const stock = await Stock.findOne({ symbol: quote.s });

      if (stock) {
        const change = price - stock.previousClose;
        const changePercent = (change / stock.previousClose) * 100;

        const updatedStock = await Stock.findOneAndUpdate(
          { symbol: quote.s },
          {
            $set: {
              price: price,
              change: change,
              changePercent: changePercent,
              lastUpdated: new Date()
            }
          },
          { new: true }
        );

        if (updatedStock) {
          console.log(`Updated stock price for ${quote.s}`);
          this.broadcastUpdate({
            event: 'price',
            symbol: updatedStock.symbol,
            price: updatedStock.price,
            change: updatedStock.change,
            changePercent: updatedStock.changePercent
          });
        }
      } else {
        console.log(`No stock found for symbol ${quote.s}`);
      }
    } catch (error) {
      console.error(`Error updating stock price for ${quote.s}:`, error);
    }
  }

  async fetchHistoricalData(symbol, from, to) {
    try {
      const historicalUrl = `${FMP_BASE_URL}/historical-price-full/${symbol}?from=${from}&to=${to}&apikey=${FMP_API_KEY}`;
      const response = await axios.get(historicalUrl);
      return response.data.historical;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      throw error;
    }
  }

  async fetchFinancialStatements(symbol) {
    try {
      const incomeStatementUrl = `${FMP_BASE_URL}/income-statement/${symbol}?apikey=${FMP_API_KEY}`;
      const balanceSheetUrl = `${FMP_BASE_URL}/balance-sheet-statement/${symbol}?apikey=${FMP_API_KEY}`;
      const cashFlowUrl = `${FMP_BASE_URL}/cash-flow-statement/${symbol}?apikey=${FMP_API_KEY}`;

      const [incomeStatement, balanceSheet, cashFlow] = await Promise.all([
        axios.get(incomeStatementUrl),
        axios.get(balanceSheetUrl),
        axios.get(cashFlowUrl)
      ]);

      return {
        incomeStatement: incomeStatement.data,
        balanceSheet: balanceSheet.data,
        cashFlow: cashFlow.data
      };
    } catch (error) {
      console.error(`Error fetching financial statements for ${symbol}:`, error);
      throw error;
    }
  }
}

module.exports = new StockService();