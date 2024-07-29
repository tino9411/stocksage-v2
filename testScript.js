const { fetchCompanyProfile } = require('./services/fetchCompanyProfile');
const { fetchHistoricalData } = require('./services/fetchHistoricalData');
const { fetchRealTimeQuote } = require('./services/fetchRealTimeQuote');
const { fetchIncomeStatement } = require('./services/fetchIncomeStatement');
const { fetchBalanceSheet } = require('./services/fetchBalanceSheet');
const { fetchCashFlowStatement } = require('./services/fetchCashFlowStatement');
const { fetchKeyMetrics } = require('./services/fetchKeyMetrics');
const { calculateTechnicalIndicators } = require('./services/calculateTechnicalIndicators');
const connectDB = require('./config/db'); // Import the database connection function
const Stock = require('./models/Stock');
require('dotenv').config();

async function runTests() {
    await connectDB(); // Connect to the database

    const symbol = 'AAPL'; // Example symbol

    console.log(`Fetching company profile for ${symbol}...`);
    const companyProfile = await fetchCompanyProfile(symbol);
    console.log('Company Profile:', companyProfile);

    //console.log(`Fetching historical data for ${symbol}...`);
    //const historicalData = await fetchHistoricalData(symbol);
    //console.log('Historical Data:', historicalData);

    //console.log(`Fetching real-time quote for ${symbol}...`);
    //const realTimeQuote = await fetchRealTimeQuote(symbol);
    //console.log('Real-Time Quote:', realTimeQuote);

    //console.log(`Fetching income statement for ${symbol}...`);
    //const incomeStatement = await fetchIncomeStatement(symbol);
    //console.log('Income Statement:', incomeStatement);

    //console.log(`Fetching balance sheet for ${symbol}...`);
    //const balanceSheet = await fetchBalanceSheet(symbol);
    //console.log('Balance Sheet:', balanceSheet);

    //console.log(`Fetching cash flow statement for ${symbol}...`);
    //const cashFlowStatement = await fetchCashFlowStatement(symbol);
    //console.log('Cash Flow Statement:', cashFlowStatement);

    //console.log(`Fetching key metrics for ${symbol}...`);
    //const keyMetrics = await fetchKeyMetrics(symbol);
    //console.log('Key Metrics:', keyMetrics);

    //console.log(`Calculating technical indicators for ${symbol}...`);
    //const technicalIndicators = await calculateTechnicalIndicators(symbol);
    //console.log('Technical Indicators:', technicalIndicators);

    console.log(`Saving data for ${symbol} to database...`);
    let stock = await Stock.findOne({ symbol: symbol });
    if (!stock) {
        stock = new Stock({ symbol: symbol });
    }

    // Update fields from company profile
    Object.assign(stock, companyProfile._doc); // Use _doc to get the raw data

    // Update real-time quote
    if (realTimeQuote) {
        stock.real_time_quote = realTimeQuote;
    } else {
        console.warn(`No real-time quote data available for ${symbol}`);
    }

    // Update historical data
    stock.historical_data = historicalData;

    // Update key metrics
    if (keyMetrics) {
        stock.key_metrics = keyMetrics;
    } else {
        console.warn(`No key metrics data available for ${symbol}`);
    }

    // Update technical indicators
    stock.technical_indicators = technicalIndicators;

    stock.last_updated = new Date();

    await stock.save();
    console.log(`Successfully updated data for ${symbol}`);
}

runTests().catch(error => {
    console.error('Error running tests:', error);
});