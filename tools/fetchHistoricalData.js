const axios = require('axios');
const Stock = require('../models/Stock');
require('dotenv').config();

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";

async function fetchHistoricalData(symbol) {
    try {
        // Check if historical data exists in the database
        const stock = await Stock.findOne({ symbol: symbol });
        if (stock && stock.historical_data && stock.historical_data.length > 0) {
            console.log(`Historical data for ${symbol} found in database.`);
            return stock.historical_data;
        }

        // If not in database, fetch from API
        const historicalUrl = `${FMP_BASE_URL}/historical-price-full/${symbol}?apikey=${FMP_API_KEY}`;
        const historicalResponse = await axios.get(historicalUrl);
        const historicalData = historicalResponse.data;

        if (!historicalData || !historicalData.historical || historicalData.historical.length === 0) {
            console.warn(`No historical data found for symbol ${symbol}`);
            return null;
        }

        const formattedHistoricalData = historicalData.historical.map(row => ({
            date: new Date(row.date),
            open: parseFloat(row.open),
            high: parseFloat(row.high),
            low: parseFloat(row.low),
            close: parseFloat(row.close),
            adjClose: parseFloat(row.adjClose),
            volume: parseInt(row.volume),
            unadjustedVolume: parseInt(row.unadjustedVolume),
            change: parseFloat(row.change),
            changePercent: parseFloat(row.changePercent),
            vwap: parseFloat(row.vwap),
            label: row.label,
            changeOverTime: parseFloat(row.changeOverTime)
        }));

        // Save the historical data to the database
        await Stock.findOneAndUpdate(
            { symbol: symbol },
            { 
                $set: { 
                    historical_data: formattedHistoricalData,
                    last_updated: new Date()
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(`Historical data for ${symbol} saved to database.`);
        return formattedHistoricalData;
    } catch (error) {
        console.error(`Error fetching historical data for ${symbol}:`, error);
        return null;
    }
}

module.exports = {
    fetchHistoricalData
};