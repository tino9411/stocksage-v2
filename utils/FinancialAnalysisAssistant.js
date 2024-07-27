const BaseAssistantService = require('./BaseAssistantService');
const { fetchIncomeStatement } = require('../services/fetchIncomeStatement');
const { fetchBalanceSheet } = require('../services/fetchBalanceSheet');
const { fetchCashFlowStatement } = require('../services/fetchCashFlowStatement');

class FinancialAnalysisAssistant extends BaseAssistantService {
    constructor(apiKey) {
        super(apiKey);
        this.assistantId = null;
        this.assistantName = 'FinancialAnalysis';
        this.instructions = `You are a financial analysis specialist. Your role is to fetch and analyze financial statements for companies. You can retrieve income statements, balance sheets, and cash flow statements, and provide insightful analysis based on this data. Your capabilities include:

        1. Fetching financial statements for a given company
        2. Calculating key financial ratios
        3. Analyzing trends in financial performance
        4. Providing insights on a company's financial health
        5. Comparing financial metrics to industry averages

        Always provide clear explanations and justifications for your analysis. Be thorough and considerate of various financial metrics and their implications.`;
    }

    async initialize({ model, name }) {
        const fetchFinancialStatementsTool = {
            type: "function",
            function: {
                name: "fetchFinancialStatements",
                description: "Fetch financial statements (income statement, balance sheet, cash flow statement) for a given company",
                parameters: {
                    type: "object",
                    properties: {
                        symbol: {
                            type: "string",
                            description: "The stock symbol of the company"
                        },
                        years: {
                            type: "integer",
                            description: "Number of years of data to fetch (default is 5)"
                        }
                    },
                    required: ["symbol"]
                }
            }
        };

        const calculateFinancialRatiosTool = {
            type: "function",
            function: {
                name: "calculateFinancialRatios",
                description: "Calculate key financial ratios based on the most recent annual financial statements",
                parameters: {
                    type: "object",
                    properties: {
                        symbol: {
                            type: "string",
                            description: "The stock symbol of the company"
                        }
                    },
                    required: ["symbol"]
                }
            }
        };

        const newAssistant = await this.createAssistant({
            model,
            name,
            instructions: this.instructions,
            tools: [fetchFinancialStatementsTool, calculateFinancialRatiosTool]
        });
        this.assistantId = newAssistant.id;
        console.log('Financial Analysis Assistant initialized:', newAssistant);
    }

    async processMessage(message, threadId) {
        console.log(`Processing message in FinancialAnalysisAssistant: ${message.content}`);
        try {
            await this.createMessage(threadId, {
                role: 'user',
                content: message.content,
            });

            let run = await this.client.beta.threads.runs.create(threadId, {
                assistant_id: this.assistantId,
            });

            const response = await this.handleRunStatus(threadId, run);
            return response;
        } catch (error) {
            console.error('Error processing message in FinancialAnalysisAssistant:', error);
            return `I apologize, but I encountered an error while processing your request. ${error.message}`;
        }
    }

    async handleRequiresAction(thread_id, run) {
        console.log('Handling required action in FinancialAnalysisAssistant...');
        if (
            run.required_action &&
            run.required_action.submit_tool_outputs &&
            run.required_action.submit_tool_outputs.tool_calls
        ) {
            const toolOutputs = await Promise.all(run.required_action.submit_tool_outputs.tool_calls.map(async (tool) => {
                const { id, function: { name, arguments: args } } = tool;
                const parsedArgs = JSON.parse(args);
                try {
                    let result;
                    if (name === 'fetchFinancialStatements') {
                        result = await this.fetchFinancialStatements(parsedArgs.symbol, parsedArgs.years);
                    } else if (name === 'calculateFinancialRatios') {
                        result = await this.calculateFinancialRatios(parsedArgs.symbol);
                    } else {
                        throw new Error(`Unknown function ${name}`);
                    }
                    return {
                        tool_call_id: id,
                        output: JSON.stringify(result),
                    };
                } catch (error) {
                    console.error(`Error executing tool ${name}:`, error);
                    return {
                        tool_call_id: id,
                        output: JSON.stringify({ error: error.message }),
                    };
                }
            }));

            try {
                run = await this.client.beta.threads.runs.submitToolOutputs(
                    thread_id,
                    run.id,
                    { tool_outputs: toolOutputs },
                );
                console.log("Tool outputs submitted successfully in FinancialAnalysisAssistant.");
            } catch (error) {
                console.error("Error submitting tool outputs in FinancialAnalysisAssistant:", error);
                throw error;
            }
        }
        return run;
    }

    async fetchFinancialStatements(symbol, years = 5) {
        const [incomeStatements, balanceSheets, cashFlowStatements] = await Promise.all([
            fetchIncomeStatement(symbol, years),
            fetchBalanceSheet(symbol, years),
            fetchCashFlowStatement(symbol, years)
        ]);

        return {
            incomeStatements,
            balanceSheets,
            cashFlowStatements
        };
    }

    async calculateFinancialRatios(symbol) {
        try {
            const [incomeStatements, balanceSheets, cashFlowStatements] = await Promise.all([
                fetchIncomeStatement(symbol, 1),
                fetchBalanceSheet(symbol, 1),
                fetchCashFlowStatement(symbol, 1)
            ]);

            if (!incomeStatements || !balanceSheets || !cashFlowStatements) {
                throw new Error("Unable to fetch all required financial data");
            }

            const latestIncomeStatement = incomeStatements[0];
            const latestBalanceSheet = balanceSheets[0];
            const latestCashFlowStatement = cashFlowStatements[0];

            if (!latestIncomeStatement || !latestBalanceSheet || !latestCashFlowStatement) {
                throw new Error("One or more financial statements are missing");
            }

            // Calculate key financial ratios
            const currentRatio = latestBalanceSheet.totalCurrentAssets / latestBalanceSheet.totalCurrentLiabilities;
            const quickRatio = (latestBalanceSheet.cashAndCashEquivalents + latestBalanceSheet.netReceivables) / latestBalanceSheet.totalCurrentLiabilities;
            const debtToEquityRatio = latestBalanceSheet.totalLiabilities / latestBalanceSheet.totalStockholdersEquity;
            const returnOnAssets = latestIncomeStatement.netIncome / latestBalanceSheet.totalAssets;
            const returnOnEquity = latestIncomeStatement.netIncome / latestBalanceSheet.totalStockholdersEquity;
            const profitMargin = latestIncomeStatement.netIncome / latestIncomeStatement.revenue;
            const assetTurnover = latestIncomeStatement.revenue / latestBalanceSheet.totalAssets;
            const inventoryTurnover = latestIncomeStatement.costOfRevenue / latestBalanceSheet.inventory;
            const operatingCashFlowRatio = latestCashFlowStatement.operatingCashFlow / latestBalanceSheet.totalCurrentLiabilities;

            return {
                currentRatio,
                quickRatio,
                debtToEquityRatio,
                returnOnAssets,
                returnOnEquity,
                profitMargin,
                assetTurnover,
                inventoryTurnover,
                operatingCashFlowRatio
            };
        } catch (error) {
            console.error(`Error calculating financial ratios for ${symbol}:`, error);
            return null;
        }
    }

}

module.exports = FinancialAnalysisAssistant;