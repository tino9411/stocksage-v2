const mongoose = require('mongoose');
const { EMA, BollingerBands, RSI, MACD, SMA, StochasticOscillator, ADX, PSAR, CCI } = require('technicalindicators');
const Stock = require('../models/Stock');
require('dotenv').config();

const calculateSMA = (data, period) => {
  if (data.length < period) return null;
  const smaValues = SMA.calculate({ period, values: data });
  return smaValues[smaValues.length - 1];
};

const calculateEMA = (data, period) => {
  if (data.length < period) return null;
  const emaValues = EMA.calculate({ period, values: data });
  return emaValues[emaValues.length - 1];
};

const calculateBollingerBands = (data, period = 20, stdDev = 2) => {
  if (data.length < period) return null;
  const bbValues = BollingerBands.calculate({ period, stdDev, values: data });
  if (bbValues.length === 0) return null;
  return bbValues[bbValues.length - 1];
};

const calculateRSI = (data, period = 14) => {
  if (data.length < period) return null;
  const rsiValues = RSI.calculate({ period, values: data });
  return rsiValues[rsiValues.length - 1];
};

const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  if (data.length < slowPeriod) return null;
  const macdValues = MACD.calculate({
    fastPeriod,
    slowPeriod,
    signalPeriod,
    values: data,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });
  if (macdValues.length === 0) return null;
  return macdValues[macdValues.length - 1];
};

const calculateStochastic = (data, period = 14, signalPeriod = 3) => {
  if (data.length < period) return null;
  const stochValues = StochasticOscillator.calculate({
    high: data.map(d => d.high),
    low: data.map(d => d.low),
    close: data.map(d => d.close),
    period,
    signalPeriod
  });
  return stochValues[stochValues.length - 1];
};

const calculateADX = (data, period = 14) => {
  if (data.length < period) return null;
  const adxValues = ADX.calculate({
    high: data.map(d => d.high),
    low: data.map(d => d.low),
    close: data.map(d => d.close),
    period
  });
  return adxValues[adxValues.length - 1];
};

const calculatePSAR = (data, step = 0.02, max = 0.2) => {
  if (data.length < 2) return null;
  const psarValues = PSAR.calculate({
    high: data.map(d => d.high),
    low: data.map(d => d.low),
    step,
    max
  });
  return psarValues[psarValues.length - 1];
};

const calculateCCI = (data, period = 20) => {
  if (data.length < period) return null;
  const cciValues = CCI.calculate({
    high: data.map(d => d.high),
    low: data.map(d => d.low),
    close: data.map(d => d.close),
    period
  });
  return cciValues[cciValues.length - 1];
};

const calculateFibonacciLevels = (data) => {
  const high = Math.max(...data.map(d => d.high));
  const low = Math.min(...data.map(d => d.low));
  const diff = high - low;
  return {
    '0': low,
    '23.6': low + 0.236 * diff,
    '38.2': low + 0.382 * diff,
    '50': low + 0.5 * diff,
    '61.8': low + 0.618 * diff,
    '100': high
  };
};

const interpretIndicator = (indicator, value, data) => {
  const lastPrice = data[data.length - 1].close;
  switch (indicator) {
    case 'SMA':
    case 'EMA':
      return lastPrice > value ? 'Buy' : lastPrice < value ? 'Sell' : 'Hold';
    case 'BollingerBands':
      return lastPrice > value.upper ? 'Sell' : lastPrice < value.lower ? 'Buy' : 'Hold';
    case 'RSI':
      return value > 70 ? 'Sell' : value < 30 ? 'Buy' : 'Hold';
    case 'MACD':
      return value.macd > value.signal ? 'Buy' : value.macd < value.signal ? 'Sell' : 'Hold';
    case 'Stochastic':
      return value.k > value.d && value.k < 20 ? 'Buy' : value.k < value.d && value.k > 80 ? 'Sell' : 'Hold';
    case 'ADX':
      return value.adx > 25 ? (value.pdi > value.mdi ? 'Buy' : 'Sell') : 'Hold';
    case 'PSAR':
      return lastPrice > value ? 'Buy' : 'Sell';
    case 'CCI':
      return value > 100 ? 'Sell' : value < -100 ? 'Buy' : 'Hold';
    default:
      return 'Hold';
  }
};

async function calculateTechnicalIndicators(symbol) {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const stock = await Stock.findOne({ symbol });
  if (!stock || !stock.historical_data) {
    console.error(`No historical data found for symbol ${symbol}`);
    return null;
  }

  const historicalData = stock.historical_data.reverse();
  const closePrices = historicalData.map(item => item.close);

  const indicators = {
    SMA: {
      50: calculateSMA(closePrices, 50),
      200: calculateSMA(closePrices, 200)
    },
    EMA: {
      9: calculateEMA(closePrices, 9),
      50: calculateEMA(closePrices, 50),
      200: calculateEMA(closePrices, 200)
    },
    BollingerBands: calculateBollingerBands(closePrices),
    RSI: calculateRSI(closePrices),
    MACD: calculateMACD(closePrices),
    Stochastic: calculateStochastic(historicalData),
    ADX: calculateADX(historicalData),
    PSAR: calculatePSAR(historicalData),
    CCI: calculateCCI(historicalData),
    FibonacciLevels: calculateFibonacciLevels(historicalData)
  };

  const interpretations = {
    SMA: {
      50: interpretIndicator('SMA', indicators.SMA[50], historicalData),
      200: interpretIndicator('SMA', indicators.SMA[200], historicalData)
    },
    EMA: {
      9: interpretIndicator('EMA', indicators.EMA[9], historicalData),
      50: interpretIndicator('EMA', indicators.EMA[50], historicalData),
      200: interpretIndicator('EMA', indicators.EMA[200], historicalData)
    },
    BollingerBands: interpretIndicator('BollingerBands', indicators.BollingerBands, historicalData),
    RSI: interpretIndicator('RSI', indicators.RSI, historicalData),
    MACD: interpretIndicator('MACD', indicators.MACD, historicalData),
    Stochastic: interpretIndicator('Stochastic', indicators.Stochastic, historicalData),
    ADX: interpretIndicator('ADX', indicators.ADX, historicalData),
    PSAR: interpretIndicator('PSAR', indicators.PSAR, historicalData),
    CCI: interpretIndicator('CCI', indicators.CCI, historicalData)
  };

  const signalCount = {
    Buy: Object.values(interpretations).flat().filter(signal => signal === 'Buy').length,
    Sell: Object.values(interpretations).flat().filter(signal => signal === 'Sell').length,
    Hold: Object.values(interpretations).flat().filter(signal => signal === 'Hold').length
  };

  const totalSignals = signalCount.Buy + signalCount.Sell + signalCount.Hold;
  const convergenceScore = {
    Buy: signalCount.Buy / totalSignals,
    Sell: signalCount.Sell / totalSignals,
    Hold: signalCount.Hold / totalSignals
  };

  const overallSignal = Object.keys(convergenceScore).reduce((a, b) => convergenceScore[a] > convergenceScore[b] ? a : b);

  return {
    symbol,
    lastPrice: historicalData[historicalData.length - 1].close,
    indicators,
    interpretations,
    signalCount,
    convergenceScore,
    overallSignal,
    analysis: `
      Based on the analysis of multiple technical indicators:
      
      - ${signalCount.Buy} indicators suggest a Buy signal
      - ${signalCount.Sell} indicators suggest a Sell signal
      - ${signalCount.Hold} indicators suggest a Hold signal
      
      The convergence score shows:
      - Buy: ${(convergenceScore.Buy * 100).toFixed(2)}%
      - Sell: ${(convergenceScore.Sell * 100).toFixed(2)}%
      - Hold: ${(convergenceScore.Hold * 100).toFixed(2)}%
      
      The overall signal based on indicator convergence is: ${overallSignal.toUpperCase()}
      
      Key observations:
      - The stock is ${interpretations.SMA[200] === 'Buy' ? 'above' : 'below'} its 200-day SMA, indicating a ${interpretations.SMA[200] === 'Buy' ? 'bullish' : 'bearish'} long-term trend.
      - RSI is at ${indicators.RSI.toFixed(2)}, suggesting the stock is ${indicators.RSI > 70 ? 'overbought' : indicators.RSI < 30 ? 'oversold' : 'neither overbought nor oversold'}.
      - MACD ${indicators.MACD.macd > indicators.MACD.signal ? 'is above' : 'is below'} its signal line, indicating ${indicators.MACD.macd > indicators.MACD.signal ? 'bullish' : 'bearish'} momentum.
      - The stock is ${interpretations.BollingerBands === 'Buy' ? 'near the lower' : interpretations.BollingerBands === 'Sell' ? 'near the upper' : 'within the'} Bollinger Bands, suggesting ${interpretations.BollingerBands === 'Hold' ? 'normal' : 'extreme'} price action.
      
      Please note that this analysis is based on historical data and technical indicators. It should not be considered as financial advice. Always conduct your own research and consider multiple factors before making investment decisions.
    `
  };
}

module.exports = {
  calculateTechnicalIndicators
};