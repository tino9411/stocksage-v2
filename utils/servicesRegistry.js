// utils/servicesRegistry.js
const fetchCompanyProfile = require('../tools/fetchCompanyProfile');
const fetchRealTimeQuote = require('../tools/fetchRealTimeQuote');
const fetchHistoricalData = require('../tools/fetchHistoricalData');
const fetchKeyMetrics = require('../tools/fetchKeyMetrics');
const fetchIncomeStatement = require('../tools/fetchIncomeStatement');
const fetchCashFlowStatement = require('../tools/fetchCashFlowStatement');
const fetchBalanceSheet = require('../tools/fetchBalanceSheet');
const calculateTechnicalIndicators = require('../tools/calculateTechnicalIndicators');

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