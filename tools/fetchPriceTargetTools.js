// services/fetchPriceTargetTools.js
const axios = require('axios');
require('dotenv').config();

const FMP_API_KEY = process.env.FMP_API_KEY;
const BASE_URL = 'https://financialmodelingprep.com/api/v4';

const fetchPriceTarget = async (symbol) => {
    const url = `${BASE_URL}/price-target?symbol=${symbol}&apikey=${FMP_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
};

const fetchPriceTargetSummary = async (symbol) => {
    const url = `${BASE_URL}/price-target-summary?symbol=${symbol}&apikey=${FMP_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
};

const fetchPriceTargetByAnalyst = async (name) => {
    const url = `${BASE_URL}/price-target-analyst-name?name=${encodeURIComponent(name)}&apikey=${FMP_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
};

const fetchPriceTargetByCompany = async (company) => {
    const url = `${BASE_URL}/price-target-analyst-company?company=${encodeURIComponent(company)}&apikey=${FMP_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
};

const fetchPriceTargetConsensus = async (symbol) => {
    const url = `${BASE_URL}/price-target-consensus?symbol=${symbol}&apikey=${FMP_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
};

module.exports = {
    fetchPriceTarget,
    fetchPriceTargetSummary,
    fetchPriceTargetByAnalyst,
    fetchPriceTargetByCompany,
    fetchPriceTargetConsensus
};