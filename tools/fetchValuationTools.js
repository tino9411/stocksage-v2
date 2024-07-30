// services/ValuationTools.js
const axios = require('axios');
require('dotenv').config();

const FMP_API_KEY = process.env.FMP_API_KEY;
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

const fetchDiscountedCashFlow = async (symbol) => {
    const url = `${BASE_URL}/discounted-cash-flow/${symbol}?apikey=${FMP_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
};

const fetchAdvancedDCF = async (symbol) => {
    const url = `${BASE_URL}/advanced_discounted_cash_flow?symbol=${symbol}&apikey=${FMP_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
};

const fetchLeveredDCF = async (symbol) => {
    const url = `${BASE_URL}/advanced_levered_discounted_cash_flow?symbol=${symbol}&apikey=${FMP_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
};

const fetchCompanyRating = async (symbol) => {
    const url = `${BASE_URL}/rating/${symbol}?apikey=${FMP_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
};

const fetchHistoricalRating = async (symbol, limit = 140) => {
    const url = `${BASE_URL}/historical-rating/${symbol}?limit=${limit}&apikey=${FMP_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
};

module.exports = {
    fetchDiscountedCashFlow,
    fetchAdvancedDCF,
    fetchLeveredDCF,
    fetchCompanyRating,
    fetchHistoricalRating
};