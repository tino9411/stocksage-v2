// services/fetchAnalystInfoTools.js
const axios = require('axios');
require('dotenv').config();

const FMP_API_KEY = process.env.FMP_API_KEY;
const BASE_URL = 'https://financialmodelingprep.com/api/v3';
const BASE_URL_V4 = 'https://financialmodelingprep.com/api/v4';

const fetchAnalystEstimates = async (symbol, period = 'annual', limit = 30) => {
    const url = `${BASE_URL}/analyst-estimates/${symbol}?period=${period}&limit=${limit}&apikey=${FMP_API_KEY}`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching analyst estimates:', error);
        throw error;
    }
};

const fetchAnalystRecommendations = async (symbol) => {
    const url = `${BASE_URL}/analyst-stock-recommendations/${symbol}?apikey=${FMP_API_KEY}`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching analyst recommendations:', error);
        throw error;
    }
};

const fetchUpgradesDowngrades = async (symbol) => {
    const url = `${BASE_URL_V4}/upgrades-downgrades?symbol=${symbol}&apikey=${FMP_API_KEY}`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching upgrades & downgrades:', error);
        throw error;
    }
};

module.exports = {
    fetchAnalystEstimates,
    fetchAnalystRecommendations,
    fetchUpgradesDowngrades
};