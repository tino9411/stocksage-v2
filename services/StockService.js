const axios = require('axios');
const WebSocket = require('ws');
const Stock = require('../models/Stock');
const { fetchRealTimeQuote } = require('../tools/fetchRealTimeQuote');

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

class StockService {
  constructor() {
    this.ws = null;
    this.subscriptions = new Map();
    this.apiKey = process.env.FINANCIAL_MODELING_PREP_API_KEY;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  initializeWebSocket() {
    this.ws = new WebSocket('wss://websockets.financialmodelingprep.com');

    this.ws.on('open', () => {
      console.log('WebSocket connection established');
      this.login();
      this.reconnectAttempts = 0;
    });

    this.ws.on('message', (data) => {
      const message = JSON.parse(data);
      this.handleMessage(message);
    });

    this.ws.on('close', () => {
      console.log('WebSocket connection closed');
      this.attemptReconnect();
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  login() {
    const loginMessage = {
      event: 'login',
      data: { apiKey: this.apiKey }
    };
    this.ws.send(JSON.stringify(loginMessage));
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.initializeWebSocket(), 5000);
    } else {
      console.error('Max reconnection attempts reached. Please check your connection and restart the application.');
    }
  }

  handleMessage(message) {
    const { s: symbol, ...data } = message;
    if (this.subscriptions.has(symbol)) {
      this.subscriptions.get(symbol).forEach(callback => callback(data));
    }
  }

  subscribe(symbols, callback) {
    symbols.forEach(symbol => {
      if (!this.subscriptions.has(symbol)) {
        this.subscriptions.set(symbol, new Set());
      }
      this.subscriptions.get(symbol).add(callback);
    });

    const subscribeMessage = {
      event: 'subscribe',
      data: { ticker: symbols }
    };
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(subscribeMessage));
    }
  }

  unsubscribe(symbols, callback) {
    symbols.forEach(symbol => {
      if (this.subscriptions.has(symbol)) {
        this.subscriptions.get(symbol).delete(callback);
        if (this.subscriptions.get(symbol).size === 0) {
          this.subscriptions.delete(symbol);
        }
      }
    });

    const unsubscribeMessage = {
      event: 'unsubscribe',
      data: { ticker: symbols }
    };
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(unsubscribeMessage));
    }
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