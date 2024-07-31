const axios = require('axios');
require('dotenv').config();

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = "https://financialmodelingprep.com/api/v4";

async function fetchInsiderTradesSearch(symbol, page = 0) {
  try {
    const url = `${FMP_BASE_URL}/insider-trading`;
    const params = {
      apikey: FMP_API_KEY,
      symbol: symbol,
      page: page
    };

    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching insider trades:', error);
    throw new Error('Failed to fetch insider trades data');
  }
}

module.exports = { fetchInsiderTradesSearch };