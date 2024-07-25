// utils/servicesRegistry.js
const fetchCompanyProfile = require('../services/fetchCompanyProfile');
const fetchRealTimeQuote = require('../services/fetchRealTimeQuote');
const fetchHistoricalData = require('../services/fetchHistoricalData');
const fetchKeyMetrics = require('../services/fetchKeyMetrics');
const fetchIncomeStatement = require('../services/fetchIncomeStatement');
const fetchCashFlowStatement = require('../services/fetchCashFlowStatement');
const fetchBalanceSheet = require('../services/fetchBalanceSheet');
const calculateTechnicalIndicators = require('../services/calculateTechnicalIndicators');

module.exports = {
    fetchCompanyProfile,
    fetchRealTimeQuote,
    fetchHistoricalData,
    fetchKeyMetrics,
    fetchIncomeStatement,
    fetchCashFlowStatement,
    fetchBalanceSheet,
    calculateTechnicalIndicators
};