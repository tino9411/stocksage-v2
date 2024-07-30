// utils/EconomicDataTools.js
const axios = require('axios');
require('dotenv').config();

const FMP_API_KEY = process.env.FMP_API_KEY;
const BASE_URL = 'https://financialmodelingprep.com/api/v4';

// Helper function to get the date 5 years ago
const getFiveYearsAgo = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 5);
    return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
};

// Helper function to get today's date
const getToday = () => {
    return new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
};

const fetchTreasuryRates = async () => {
    const from = getFiveYearsAgo();
    const to = getToday();
    const url = `${BASE_URL}/treasury?from=${from}&to=${to}&apikey=${FMP_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
};

const fetchEconomicIndicators = async (name) => {
    const from = getFiveYearsAgo();
    const to = getToday();
    const url = `${BASE_URL}/economic?name=${name}&from=${from}&to=${to}&apikey=${FMP_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
};

const fetchEconomicCalendar = async () => {
    const from = getFiveYearsAgo();
    const to = getToday();
    const url = `${BASE_URL}/economic_calendar?from=${from}&to=${to}&apikey=${FMP_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
};

const fetchMarketRiskPremium = async () => {
    const url = `${BASE_URL}/market_risk_premium?apikey=${FMP_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
};

module.exports = {
    fetchTreasuryRates,
    fetchEconomicIndicators,
    fetchEconomicCalendar,
    fetchMarketRiskPremium
};