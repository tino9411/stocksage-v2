const mongoose = require('mongoose');
const { EMA, BollingerBands, RSI, MACD } = require('technicalindicators');
const Stock = require('../models/Stock');

require('dotenv').config();

const calculateEMA = (data, period) => {
    if (data.length < period) return null; // Not enough data points
    const emaValues = EMA.calculate({ period, values: data });
    return emaValues[emaValues.length - 1]; // Return the last data point
};

const calculateBollingerBands = (data, period = 20, stdDev = 2) => {
    if (data.length < period) return null; // Not enough data points
    const bbValues = BollingerBands.calculate({ period, stdDev, values: data });
    if (bbValues.length === 0) return null; // Handle case where no values are returned

    const lastBB = bbValues[bbValues.length - 1];
    return {
        upper: lastBB.upper,
        middle: lastBB.middle,
        lower: lastBB.lower
    }; // Return the last data point
};

const calculateRSI = (data, period = 14) => {
    if (data.length < period) return null; // Not enough data points
    const rsiValues = RSI.calculate({ period, values: data });
    return rsiValues[rsiValues.length - 1]; // Return the last data point
};

const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
    if (data.length < slowPeriod) return null; // Not enough data points
    const macdValues = MACD.calculate({
        fastPeriod,
        slowPeriod,
        signalPeriod,
        values: data,
        SimpleMAOscillator: false,
        SimpleMASignal: false
    });
    if (macdValues.length === 0) return null; // Handle case where no values are returned

    const lastMACD = macdValues[macdValues.length - 1];
    return {
        macd: lastMACD.MACD,
        signal: lastMACD.signal,
        histogram: lastMACD.histogram
    }; // Return the last data point
};

async function calculateTechnicalIndicators(symbol) {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    const stock = await Stock.findOne({ symbol });
    if (!stock || !stock.historical_data) {
        console.error(`No historical data found for symbol ${symbol}`);
        return null;
    }

    const historicalData = stock.historical_data.map(item => item.close).reverse();

    const ema50 = calculateEMA(historicalData, 50);
    const ema200 = calculateEMA(historicalData, 200);
    const ema9 = calculateEMA(historicalData, 9);
    const bollingerBands = calculateBollingerBands(historicalData);
    const rsi = calculateRSI(historicalData);
    const macd = calculateMACD(historicalData);

    return { ema50, ema200, ema9, bollingerBands, rsi, macd };
}

module.exports = {
    calculateTechnicalIndicators
};