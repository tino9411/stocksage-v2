const axios = require('axios');
require('dotenv').config();

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";

async function fetchKeyMetrics(symbol, years = 5) {
    try {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - years * 365 * 24 * 60 * 60 * 1000);
        
        // Fetch both annual and quarterly data
        const annualUrl = `${FMP_BASE_URL}/key-metrics/${symbol}?period=annual&limit=${years}&apikey=${FMP_API_KEY}`;
        const quarterlyUrl = `${FMP_BASE_URL}/key-metrics/${symbol}?period=quarter&limit=${years * 4}&apikey=${FMP_API_KEY}`;

        const [annualResponse, quarterlyResponse] = await Promise.all([
            axios.get(annualUrl),
            axios.get(quarterlyUrl)
        ]);

        const annualData = annualResponse.data;
        const quarterlyData = quarterlyResponse.data;

        const allMetrics = [...annualData, ...quarterlyData];

        if (allMetrics.length === 0) {
            console.warn(`No key metrics data found for ${symbol}`);
            return null;
        }

        const keyMetrics = allMetrics
            .filter(metrics => new Date(metrics.date) >= startDate)
            .map(metrics => ({
                date: new Date(metrics.date),
                period: metrics.period,
                symbol: symbol,
                revenuePerShare: metrics.revenuePerShare,
                netIncomePerShare: metrics.netIncomePerShare,
                operatingCashFlowPerShare: metrics.operatingCashFlowPerShare,
                freeCashFlowPerShare: metrics.freeCashFlowPerShare,
                cashPerShare: metrics.cashPerShare,
                bookValuePerShare: metrics.bookValuePerShare,
                tangibleBookValuePerShare: metrics.tangibleBookValuePerShare,
                shareholdersEquityPerShare: metrics.shareholdersEquityPerShare,
                interestDebtPerShare: metrics.interestDebtPerShare,
                marketCap: metrics.marketCap,
                enterpriseValue: metrics.enterpriseValue,
                peRatio: metrics.peRatio,
                priceToSalesRatio: metrics.priceToSalesRatio,
                pocfratio: metrics.pocfratio,
                pfcfRatio: metrics.pfcfRatio,
                pbRatio: metrics.pbRatio,
                ptbRatio: metrics.ptbRatio,
                evToSales: metrics.evToSales,
                enterpriseValueOverEBITDA: metrics.enterpriseValueOverEBITDA,
                evToOperatingCashFlow: metrics.evToOperatingCashFlow,
                evToFreeCashFlow: metrics.evToFreeCashFlow,
                earningsYield: metrics.earningsYield,
                freeCashFlowYield: metrics.freeCashFlowYield,
                debtToEquity: metrics.debtToEquity,
                debtToAssets: metrics.debtToAssets,
                netDebtToEBITDA: metrics.netDebtToEBITDA,
                currentRatio: metrics.currentRatio,
                interestCoverage: metrics.interestCoverage,
                incomeQuality: metrics.incomeQuality,
                dividendYield: metrics.dividendYield,
                payoutRatio: metrics.payoutRatio,
                salesGeneralAndAdministrativeToRevenue: metrics.salesGeneralAndAdministrativeToRevenue,
                researchAndDevelopmentToRevenue: metrics.researchAndDevelopementToRevenue,
                intangiblesToTotalAssets: metrics.intangiblesToTotalAssets,
                capexToOperatingCashFlow: metrics.capexToOperatingCashFlow,
                capexToRevenue: metrics.capexToRevenue,
                capexToDepreciation: metrics.capexToDepreciation,
                stockBasedCompensationToRevenue: metrics.stockBasedCompensationToRevenue,
                grahamNumber: metrics.grahamNumber,
                roic: metrics.roic,
                returnOnTangibleAssets: metrics.returnOnTangibleAssets,
                grahamNetNet: metrics.grahamNetNet,
                workingCapital: metrics.workingCapital,
                tangibleAssetValue: metrics.tangibleAssetValue,
                netCurrentAssetValue: metrics.netCurrentAssetValue,
                investedCapital: metrics.investedCapital,
                averageReceivables: metrics.averageReceivables,
                averagePayables: metrics.averagePayables,
                averageInventory: metrics.averageInventory,
                daysSalesOutstanding: metrics.daysSalesOutstanding,
                daysPayablesOutstanding: metrics.daysPayablesOutstanding,
                daysOfInventoryOnHand: metrics.daysOfInventoryOnHand,
                receivablesTurnover: metrics.receivablesTurnover,
                payablesTurnover: metrics.payablesTurnover,
                inventoryTurnover: metrics.inventoryTurnover,
                roe: metrics.roe,
                capexPerShare: metrics.capexPerShare
            }));

        // Sort key metrics by date (newest first)
        keyMetrics.sort((a, b) => b.date - a.date);

        return keyMetrics;

    } catch (error) {
        console.error(`Error fetching key metrics data for ${symbol}:`, error);
        return null;
    }
}

module.exports = {
    fetchKeyMetrics
};