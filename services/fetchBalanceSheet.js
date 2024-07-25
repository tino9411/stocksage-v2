const Stock = require('../models/Stock');
const axios = require('axios');
require('dotenv').config();

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";

async function fetchBalanceSheet(symbol, years = 5, forceRefresh = false) {
    try {
        let stock = await Stock.findOne({ symbol: symbol });
        
        // Check if we already have recent balance sheets (e.g., less than 1 day old)
        if (!forceRefresh && stock && stock.balance_sheets && stock.balance_sheets.length > 0) {
            const latestStatement = stock.balance_sheets[0];
            if ((new Date() - latestStatement.date) / (1000 * 60 * 60 * 24) < 1) {
                console.log(`Using cached balance sheets for ${symbol}`);
                return stock.balance_sheets;
            }
        }

        // If no recent data, fetch from FMP API
        const annualUrl = `${FMP_BASE_URL}/balance-sheet-statement/${symbol}?period=annual&limit=${years}&apikey=${FMP_API_KEY}`;
        const quarterlyUrl = `${FMP_BASE_URL}/balance-sheet-statement/${symbol}?period=quarter&limit=${years * 4}&apikey=${FMP_API_KEY}`;

        const [annualResponse, quarterlyResponse] = await Promise.all([
            axios.get(annualUrl),
            axios.get(quarterlyUrl)
        ]);

        const annualData = annualResponse.data;
        const quarterlyData = quarterlyResponse.data;

        if (annualData.length === 0 && quarterlyData.length === 0) {
            console.warn(`No balance sheet data found for ${symbol}`);
            return null;
        }

        const balanceSheets = [...annualData, ...quarterlyData]
            .map(statement => ({
                date: new Date(statement.date),
                symbol: statement.symbol,
                reportedCurrency: statement.reportedCurrency,
                cik: statement.cik,
                fillingDate: new Date(statement.fillingDate),
                acceptedDate: new Date(statement.acceptedDate),
                calendarYear: statement.calendarYear,
                period: statement.period,
                cashAndCashEquivalents: statement.cashAndCashEquivalents,
                shortTermInvestments: statement.shortTermInvestments,
                cashAndShortTermInvestments: statement.cashAndShortTermInvestments,
                netReceivables: statement.netReceivables,
                inventory: statement.inventory,
                otherCurrentAssets: statement.otherCurrentAssets,
                totalCurrentAssets: statement.totalCurrentAssets,
                propertyPlantEquipmentNet: statement.propertyPlantEquipmentNet,
                goodwill: statement.goodwill,
                intangibleAssets: statement.intangibleAssets,
                goodwillAndIntangibleAssets: statement.goodwillAndIntangibleAssets,
                longTermInvestments: statement.longTermInvestments,
                taxAssets: statement.taxAssets,
                otherNonCurrentAssets: statement.otherNonCurrentAssets,
                totalNonCurrentAssets: statement.totalNonCurrentAssets,
                otherAssets: statement.otherAssets,
                totalAssets: statement.totalAssets,
                accountPayables: statement.accountPayables,
                shortTermDebt: statement.shortTermDebt,
                taxPayables: statement.taxPayables,
                deferredRevenue: statement.deferredRevenue,
                otherCurrentLiabilities: statement.otherCurrentLiabilities,
                totalCurrentLiabilities: statement.totalCurrentLiabilities,
                longTermDebt: statement.longTermDebt,
                deferredRevenueNonCurrent: statement.deferredRevenueNonCurrent,
                deferredTaxLiabilitiesNonCurrent: statement.deferredTaxLiabilitiesNonCurrent,
                otherNonCurrentLiabilities: statement.otherNonCurrentLiabilities,
                totalNonCurrentLiabilities: statement.totalNonCurrentLiabilities,
                otherLiabilities: statement.otherLiabilities,
                capitalLeaseObligations: statement.capitalLeaseObligations,
                totalLiabilities: statement.totalLiabilities,
                preferredStock: statement.preferredStock,
                commonStock: statement.commonStock,
                retainedEarnings: statement.retainedEarnings,
                accumulatedOtherComprehensiveIncomeLoss: statement.accumulatedOtherComprehensiveIncomeLoss,
                othertotalStockholdersEquity: statement.othertotalStockholdersEquity,
                totalStockholdersEquity: statement.totalStockholdersEquity,
                totalLiabilitiesAndStockholdersEquity: statement.totalLiabilitiesAndStockholdersEquity,
                minorityInterest: statement.minorityInterest,
                totalEquity: statement.totalEquity,
                totalLiabilitiesAndTotalEquity: statement.totalLiabilitiesAndTotalEquity,
                totalInvestments: statement.totalInvestments,
                totalDebt: statement.totalDebt,
                netDebt: statement.netDebt
            }));

        // Sort balance sheets by date (newest first)
        balanceSheets.sort((a, b) => b.date - a.date);

        // Update the stock object with new balance sheets
        if (stock) {
            stock.balance_sheets = balanceSheets;
            await stock.save();
        } else {
            stock = new Stock({ symbol: symbol, balance_sheets: balanceSheets });
            await stock.save();
        }

        console.log(`Successfully fetched and saved balance sheet data for ${symbol}`);
        return balanceSheets;

    } catch (error) {
        console.error(`Error fetching balance sheet data for ${symbol}:`, error);
        return null;
    }
}

module.exports = {
fetchBalanceSheet
};