const Stock = require('../models/Stock');
const axios = require('axios');
require('dotenv').config();

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";

async function fetchCashFlowStatement(symbol, years = 5, forceRefresh = false) {
    try {
        let stock = await Stock.findOne({ symbol: symbol });
        
        // Check if we already have recent cash flow statements (e.g., less than 1 day old)
        if (!forceRefresh && stock && stock.cash_flow_statements && stock.cash_flow_statements.length > 0) {
            const latestStatement = stock.cash_flow_statements[0];
            if ((new Date() - latestStatement.date) / (1000 * 60 * 60 * 24) < 1) {
                console.log(`Using cached cash flow statements for ${symbol}`);
                return stock.cash_flow_statements;
            }
        }

        // If no recent data, fetch from FMP API
        const annualUrl = `${FMP_BASE_URL}/cash-flow-statement/${symbol}?period=annual&limit=${years}&apikey=${FMP_API_KEY}`;
        const quarterlyUrl = `${FMP_BASE_URL}/cash-flow-statement/${symbol}?period=quarter&limit=${years * 4}&apikey=${FMP_API_KEY}`;

        const [annualResponse, quarterlyResponse] = await Promise.all([
            axios.get(annualUrl),
            axios.get(quarterlyUrl)
        ]);

        const annualData = annualResponse.data;
        const quarterlyData = quarterlyResponse.data;

        if (annualData.length === 0 && quarterlyData.length === 0) {
            console.warn(`No cash flow statement data found for ${symbol}`);
            return null;
        }

        const cashFlowStatements = [...annualData, ...quarterlyData]
            .map(statement => ({
                date: new Date(statement.date),
                symbol: statement.symbol,
                reportedCurrency: statement.reportedCurrency,
                cik: statement.cik,
                fillingDate: new Date(statement.fillingDate),
                acceptedDate: new Date(statement.acceptedDate),
                calendarYear: statement.calendarYear,
                period: statement.period,
                netIncome: statement.netIncome,
                depreciationAndAmortization: statement.depreciationAndAmortization,
                deferredIncomeTax: statement.deferredIncomeTax,
                stockBasedCompensation: statement.stockBasedCompensation,
                changeInWorkingCapital: statement.changeInWorkingCapital,
                accountsReceivables: statement.accountsReceivables,
                inventory: statement.inventory,
                accountsPayables: statement.accountsPayables,
                otherWorkingCapital: statement.otherWorkingCapital,
                otherNonCashItems: statement.otherNonCashItems,
                netCashProvidedByOperatingActivities: statement.netCashProvidedByOperatingActivities,
                investmentsInPropertyPlantAndEquipment: statement.investmentsInPropertyPlantAndEquipment,
                acquisitionsNet: statement.acquisitionsNet,
                purchasesOfInvestments: statement.purchasesOfInvestments,
                salesMaturitiesOfInvestments: statement.salesMaturitiesOfInvestments,
                otherInvestingActivites: statement.otherInvestingActivites,
                netCashUsedForInvestingActivites: statement.netCashUsedForInvestingActivites,
                debtRepayment: statement.debtRepayment,
                commonStockIssued: statement.commonStockIssued,
                commonStockRepurchased: statement.commonStockRepurchased,
                dividendsPaid: statement.dividendsPaid,
                otherFinancingActivites: statement.otherFinancingActivites,
                netCashUsedProvidedByFinancingActivities: statement.netCashUsedProvidedByFinancingActivities,
                effectOfForexChangesOnCash: statement.effectOfForexChangesOnCash,
                netChangeInCash: statement.netChangeInCash,
                cashAtEndOfPeriod: statement.cashAtEndOfPeriod,
                cashAtBeginningOfPeriod: statement.cashAtBeginningOfPeriod,
                operatingCashFlow: statement.operatingCashFlow,
                capitalExpenditure: statement.capitalExpenditure,
                freeCashFlow: statement.freeCashFlow
            }));

        // Sort cash flow statements by date (newest first)
        cashFlowStatements.sort((a, b) => b.date - a.date);

        // Update the stock object with new cash flow statements
        if (stock) {
            stock.cash_flow_statements = cashFlowStatements;
            await stock.save();
        } else {
            stock = new Stock({ symbol: symbol, cash_flow_statements: cashFlowStatements });
            await stock.save();
        }

        console.log(`Successfully fetched and saved cash flow statement data for ${symbol}`);
        return cashFlowStatements;

    } catch (error) {
        console.error(`Error fetching cash flow statement data for ${symbol}:`, error);
        return null;
    }
}

module.exports = {
    fetchCashFlowStatement
};