//services/fetchIncomeStatement.js
const Stock = require('../models/Stock');
const axios = require('axios');
require('dotenv').config();

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";

async function fetchIncomeStatement(symbol, years = 5, forceRefresh = false, maxRetries = 3) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            let stock = await Stock.findOne({ symbol: symbol });
            
            // Check if we already have recent income statements (e.g., less than 1 day old)
            if (!forceRefresh && stock && stock.income_statement && stock.income_statement.length > 0) {
                const latestStatement = stock.income_statement[0];
                if ((new Date() - latestStatement.date) / (1000 * 60 * 60 * 24) < 1) {
                    console.log(`Using cached income statements for ${symbol}`);
                    return stock.income_statement;
                }
            }

            // If no recent data, fetch from FMP API
            const annualUrl = `${FMP_BASE_URL}/income-statement/${symbol}?period=annual&limit=${years}&apikey=${FMP_API_KEY}`;
            const quarterlyUrl = `${FMP_BASE_URL}/income-statement/${symbol}?period=quarter&limit=${years * 4}&apikey=${FMP_API_KEY}`;

            const [annualResponse, quarterlyResponse] = await Promise.all([
                axios.get(annualUrl),
                axios.get(quarterlyUrl)
            ]);

            const annualData = annualResponse.data;
            const quarterlyData = quarterlyResponse.data;

            if (annualData.length === 0 && quarterlyData.length === 0) {
                console.warn(`No income statement data found for ${symbol}`);
                return null;
            }


        const incomeStatements = [...annualData, ...quarterlyData]
            .map(statement => ({
                date: new Date(statement.date),
                symbol: statement.symbol,
                reportedCurrency: statement.reportedCurrency,
                cik: statement.cik,
                fillingDate: new Date(statement.fillingDate),
                acceptedDate: new Date(statement.acceptedDate),
                calendarYear: statement.calendarYear,
                period: statement.period,
                revenue: statement.revenue,
                costOfRevenue: statement.costOfRevenue,
                grossProfit: statement.grossProfit,
                grossProfitRatio: statement.grossProfitRatio,
                researchAndDevelopmentExpenses: statement.researchAndDevelopmentExpenses,
                generalAndAdministrativeExpenses: statement.generalAndAdministrativeExpenses,
                sellingAndMarketingExpenses: statement.sellingAndMarketingExpenses,
                sellingGeneralAndAdministrativeExpenses: statement.sellingGeneralAndAdministrativeExpenses,
                otherExpenses: statement.otherExpenses,
                operatingExpenses: statement.operatingExpenses,
                costAndExpenses: statement.costAndExpenses,
                interestIncome: statement.interestIncome,
                interestExpense: statement.interestExpense,
                depreciationAndAmortization: statement.depreciationAndAmortization,
                ebitda: statement.ebitda,
                ebitdaratio: statement.ebitdaratio,
                operatingIncome: statement.operatingIncome,
                operatingIncomeRatio: statement.operatingIncomeRatio,
                totalOtherIncomeExpensesNet: statement.totalOtherIncomeExpensesNet,
                incomeBeforeTax: statement.incomeBeforeTax,
                incomeBeforeTaxRatio: statement.incomeBeforeTaxRatio,
                incomeTaxExpense: statement.incomeTaxExpense,
                netIncome: statement.netIncome,
                netIncomeRatio: statement.netIncomeRatio,
                eps: statement.eps,
                epsdiluted: statement.epsdiluted,
                weightedAverageShsOut: statement.weightedAverageShsOut,
                weightedAverageShsOutDil: statement.weightedAverageShsOutDil
            }));

        // Sort income statements by date (newest first)
        incomeStatements.sort((a, b) => b.date - a.date);

         // Update the stock object with new income statements
         if (stock) {
            stock = await Stock.findOneAndUpdate(
                { _id: stock._id },
                { $set: { income_statement: incomeStatements } },
                { new: true, runValidators: true }
            );
        } else {
            stock = await Stock.create({ symbol: symbol, income_statement: incomeStatements });
        }

        console.log(`Successfully fetched and saved income statement data for ${symbol}`);
        return incomeStatements;

    } catch (error) {
        if (error.name === 'VersionError' && retries < maxRetries - 1) {
            console.log(`Retrying due to VersionError (attempt ${retries + 1} of ${maxRetries})`);
            retries++;
        } else {
            console.error(`Error fetching income statement data for ${symbol}:`, error);
            return null;
        }
    }
}
}

module.exports = {
fetchIncomeStatement
};