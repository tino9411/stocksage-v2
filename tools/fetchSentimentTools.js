// utils/SentimentAnalysisTools.js
const axios = require('axios');
require('dotenv').config();

const FMP_API_KEY = process.env.FMP_API_KEY;
const BASE_URL = 'https://financialmodelingprep.com/api/v4';

const fetchHistoricalSocialSentiment = async (symbol) => {
    const url = `${BASE_URL}/historical/social-sentiment?symbol=${symbol}&page=0&apikey=${FMP_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
};

const fetchTrendingSocialSentiment = async (type, source) => {
    const url = `${BASE_URL}/social-sentiments/trending?type=${type}&source=${source}&apikey=${FMP_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
};

const fetchSocialSentimentChanges = async (type, source) => {
    const url = `${BASE_URL}/social-sentiments/change?type=${type}&source=${source}&apikey=${FMP_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
};

module.exports = {
    fetchHistoricalSocialSentiment,
    fetchTrendingSocialSentiment,
    fetchSocialSentimentChanges
};