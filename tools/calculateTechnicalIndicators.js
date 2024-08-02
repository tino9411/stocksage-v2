const mongoose = require('mongoose');
const { EMA, BollingerBands, RSI, MACD, SMA, Stochastic, ADX, PSAR, CCI } = require('technicalindicators');
const Stock = require('../models/Stock');
const { fetchHistoricalData } = require('./fetchHistoricalData');
require('dotenv').config();

// Minimum required data points for calculations
const MIN_DATA_POINTS = 200;

const calculateStandardDeviation = (values) => {
    const avg = values.reduce((a, b) => a + b) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  };
  
  // Dynamic threshold calculation based on recent volatility
  const calculateDynamicThresholds = (data, period = 20) => {
    const recentData = data.slice(0, period);
    const volatility = calculateStandardDeviation(recentData.map(d => d.changePercent));
    return {
      rsiOverbought: 70 + volatility * 2,
      rsiOversold: 30 - volatility * 2,
      adxTrend: 25 + volatility * 5,
      cciExtreme: 100 + volatility * 10
    };
  };


const calculateSMA = (data, period) => {
    if (data.length < period) return null;
    const reversedData = data.slice().reverse();
    const smaValues = SMA.calculate({ period, values: reversedData });
    return smaValues[smaValues.length - 1];
  };
  
  const calculateEMA = (data, period) => {
    if (data.length < period) return null;
    const reversedData = data.slice().reverse();
    const emaValues = EMA.calculate({ period, values: reversedData });
    return emaValues[emaValues.length - 1];
  };
  
  const calculateBollingerBands = (data, period = 20, stdDev = 2) => {
    if (data.length < period) return null;
    const reversedData = data.slice().reverse();
    const bbValues = BollingerBands.calculate({ period, stdDev, values: reversedData });
    return bbValues[bbValues.length - 1];
  };
  
  const calculateRSI = (data, period = 14) => {
    if (data.length < period) return null;
    const reversedData = data.slice().reverse();
    const rsiValues = RSI.calculate({ period, values: reversedData });
    return rsiValues[rsiValues.length - 1];
  };
  
  const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
    if (data.length < slowPeriod) return null;
    const reversedData = data.slice().reverse();
    const macdValues = MACD.calculate({
      fastPeriod,
      slowPeriod,
      signalPeriod,
      values: reversedData,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });
    return macdValues[macdValues.length - 1];
  };
  
  const calculateStochastic = (data, period = 14, signalPeriod = 3) => {
    if (data.length < period) return null;
    const reversedData = data.slice().reverse();
    const stochValues = Stochastic.calculate({
      high: reversedData.map(d => d.high),
      low: reversedData.map(d => d.low),
      close: reversedData.map(d => d.close),
      period,
      signalPeriod
    });
    return stochValues[stochValues.length - 1];
  };
  
  const calculateADX = (data, period = 14) => {
    if (data.length < period) return null;
    const reversedData = data.slice().reverse();
    const adxValues = ADX.calculate({
      high: reversedData.map(d => d.high),
      low: reversedData.map(d => d.low),
      close: reversedData.map(d => d.close),
      period
    });
    return adxValues[adxValues.length - 1];
  };
  
  const calculatePSAR = (data, step = 0.02, max = 0.2) => {
    if (data.length < 2) return null;
    const reversedData = data.slice().reverse();
    const psarValues = PSAR.calculate({
      high: reversedData.map(d => d.high),
      low: reversedData.map(d => d.low),
      step,
      max
    });
    return psarValues[psarValues.length - 1];
  };
  
  const calculateCCI = (data, period = 20) => {
    if (data.length < period) return null;
    const reversedData = data.slice().reverse();
    const cciValues = CCI.calculate({
      high: reversedData.map(d => d.high),
      low: reversedData.map(d => d.low),
      close: reversedData.map(d => d.close),
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
  
  const interpretIndicator = (indicator, value, data, thresholds) => {
    const lastPrice = data[0].close;
    switch (indicator) {
      case 'SMA':
      case 'EMA':
        return lastPrice > value ? 'Buy' : lastPrice < value ? 'Sell' : 'Hold';
      case 'BollingerBands':
        return lastPrice > value.upper ? 'Sell' : lastPrice < value.lower ? 'Buy' : 'Hold';
      case 'RSI':
        return value > thresholds.rsiOverbought ? 'Sell' : value < thresholds.rsiOversold ? 'Buy' : 'Hold';
      case 'MACD':
        return value.macd > value.signal ? 'Buy' : value.macd < value.signal ? 'Sell' : 'Hold';
      case 'Stochastic':
        return value.k > value.d && value.k < 20 ? 'Buy' : value.k < value.d && value.k > 80 ? 'Sell' : 'Hold';
      case 'ADX':
        return value.adx > thresholds.adxTrend ? (value.pdi > value.mdi ? 'Buy' : 'Sell') : 'Hold';
      case 'PSAR':
        return lastPrice > value ? 'Buy' : 'Sell';
      case 'CCI':
        return value > thresholds.cciExtreme ? 'Sell' : value < -thresholds.cciExtreme ? 'Buy' : 'Hold';
      default:
        return 'Hold';
    }
  };

const validateIndicator = (name, value) => {
    const ranges = {
      SMA: [0, Infinity],
      EMA: [0, Infinity],
      RSI: [0, 100],
      ADX: [0, 100],
      CCI: [-Infinity, Infinity]
    };
    
    if (ranges[name]) {
      const [min, max] = ranges[name];
      return value >= min && value <= max;
    }
    return true; // For indicators without specific ranges
  };

  const calculateTechnicalIndicators = async (symbol) => {
    const historicalData = await fetchHistoricalData(symbol);
    
    if (!historicalData || historicalData.length < MIN_DATA_POINTS) {
      console.error(`Insufficient historical data for symbol ${symbol}. Minimum required: ${MIN_DATA_POINTS}, Received: ${historicalData.length}`);
      return null;
    }
  
    const dynamicThresholds = calculateDynamicThresholds(historicalData);
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
  
    // Validate indicators
    for (const [name, value] of Object.entries(indicators)) {
      if (!validateIndicator(name, value)) {
        console.warn(`Invalid ${name} value calculated: ${value}`);
      }
    }
  
    const interpretations = {
      SMA: {
        50: interpretIndicator('SMA', indicators.SMA[50], historicalData, dynamicThresholds),
        200: interpretIndicator('SMA', indicators.SMA[200], historicalData, dynamicThresholds)
      },
      EMA: {
        9: interpretIndicator('EMA', indicators.EMA[9], historicalData, dynamicThresholds),
        50: interpretIndicator('EMA', indicators.EMA[50], historicalData, dynamicThresholds),
        200: interpretIndicator('EMA', indicators.EMA[200], historicalData, dynamicThresholds)
      },
      BollingerBands: interpretIndicator('BollingerBands', indicators.BollingerBands, historicalData, dynamicThresholds),
      RSI: interpretIndicator('RSI', indicators.RSI, historicalData, dynamicThresholds),
      MACD: interpretIndicator('MACD', indicators.MACD, historicalData, dynamicThresholds),
      Stochastic: interpretIndicator('Stochastic', indicators.Stochastic, historicalData, dynamicThresholds),
      ADX: interpretIndicator('ADX', indicators.ADX, historicalData, dynamicThresholds),
      PSAR: interpretIndicator('PSAR', indicators.PSAR, historicalData, dynamicThresholds),
      CCI: interpretIndicator('CCI', indicators.CCI, historicalData, dynamicThresholds)
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
        /* lastPrice: historicalData[0].close, */
        indicators,
        /* interpretations, */
        /* signalCount, */
        /* convergenceScore, */
       /*  overallSignal, */
        /* analysis: `
          Based on the analysis of multiple technical indicators using data from ${historicalData[historicalData.length - 1].date} to ${historicalData[0].date}:
          
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
          - RSI is at ${indicators.RSI.toFixed(2)}, suggesting the stock is ${indicators.RSI > dynamicThresholds.rsiOverbought ? 'overbought' : indicators.RSI < dynamicThresholds.rsiOversold ? 'oversold' : 'neither overbought nor oversold'}.
          - MACD ${indicators.MACD.macd > indicators.MACD.signal ? 'is above' : 'is below'} its signal line, indicating ${indicators.MACD.macd > indicators.MACD.signal ? 'bullish' : 'bearish'} momentum.
          - The stock is ${interpretations.BollingerBands === 'Buy' ? 'near the lower' : interpretations.BollingerBands === 'Sell' ? 'near the upper' : 'within the'} Bollinger Bands, suggesting ${interpretations.BollingerBands === 'Hold' ? 'normal' : 'extreme'} price action.
          
          Note: This analysis uses dynamic thresholds based on recent market volatility. The current RSI overbought/oversold thresholds are ${dynamicThresholds.rsiOverbought.toFixed(2)}/${dynamicThresholds.rsiOversold.toFixed(2)}.
          
          Please note that this analysis is based on historical data and technical indicators. It should not be considered as financial advice. Always conduct your own research and consider multiple factors before making investment decisions.
        ` */
      };
    };
    
    module.exports = {
        calculateTechnicalIndicators
      };