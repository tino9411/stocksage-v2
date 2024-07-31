//tools/fetchRealTimeQuote.js
const axios = require('axios');
require('dotenv').config();

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";

async function fetchRealTimeQuote(symbol) {
    try {
        const url = `${FMP_BASE_URL}/quote/${symbol}?apikey=${FMP_API_KEY}`;
        const response = await axios.get(url);
        const data = response.data;

        if (!data || data.length === 0) {
            console.warn(`Empty response when fetching real-time quote for ${symbol}`);
            return null;
        }

        const quoteData = data[0];

        // Helper functions
        const safeFloat = (value) => isNaN(parseFloat(value)) ? null : parseFloat(value);
        const safeInt = (value) => isNaN(parseInt(value)) ? null : parseInt(value);
        const safeDate = (value) => {
            if (!value) return null;
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date;
        };
        const safeTimestamp = (value) => {
            if (!value) return null;
            const date = new Date(value * 1000); // Convert from Unix timestamp to JavaScript Date object
            return isNaN(date.getTime()) ? null : date;
        };

        return {
            price: safeFloat(quoteData.price),
            changesPercentage: safeFloat(quoteData.changesPercentage),
            change: safeFloat(quoteData.change),
            dayLow: safeFloat(quoteData.dayLow),
            dayHigh: safeFloat(quoteData.dayHigh),
            yearHigh: safeFloat(quoteData.yearHigh),
            yearLow: safeFloat(quoteData.yearLow),
            marketCap: safeFloat(quoteData.marketCap),
            priceAvg50: safeFloat(quoteData.priceAvg50),
            priceAvg200: safeFloat(quoteData.priceAvg200),
            volume: safeInt(quoteData.volume),
            avgVolume: safeInt(quoteData.avgVolume),
            open: safeFloat(quoteData.open),
            previousClose: safeFloat(quoteData.previousClose),
            eps: safeFloat(quoteData.eps),
            pe: safeFloat(quoteData.pe),
            earningsAnnouncement: safeDate(quoteData.earningsAnnouncement),
            sharesOutstanding: safeFloat(quoteData.sharesOutstanding),
            timestamp: safeTimestamp(quoteData.timestamp)
        };

    } catch (error) {
        console.error(`Error fetching real-time quote for ${symbol}:`, error);
        return null;
    }
}

module.exports = {
    fetchRealTimeQuote
};