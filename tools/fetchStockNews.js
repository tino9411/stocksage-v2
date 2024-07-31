const axios = require('axios');
require('dotenv').config();

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";

async function fetchStockNews({
  tickers,
  page = 0,
  from,
  to,
  limit,
  isPressRelease = false,
  symbol
}) {
  try {
    let url, params;

    if (isPressRelease) {
      url = `${FMP_BASE_URL}/press-releases/${symbol}`;
      params = { apikey: FMP_API_KEY, page };
    } else {
      url = `${FMP_BASE_URL}/stock_news`;
      params = {
        apikey: FMP_API_KEY,
        tickers,
        page,
        from,
        to,
        limit
      };
    }

    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching stock news:', error);
    throw new Error('Failed to fetch stock news data');
  }
}

module.exports = { fetchStockNews };