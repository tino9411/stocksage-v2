const BaseAssistantService = require('./BaseAssistantService');
const { fetchHistoricalData } = require('../services/fetchHistoricalData');
const { fetchRealTimeQuote } = require('../services/fetchRealTimeQuote');

class TechnicalAnalysisAssistant extends BaseAssistantService {
    constructor(apiKey) {
        super(apiKey);
        this.assistantId = null;
        this.assistantName = 'TechnicalAnalysis';
        this.instructions = `You are a technical analysis specialist. Your role is to analyze stock price data and provide insights based on technical indicators and chart patterns. Your capabilities include:

        1. Fetching historical price data for a given stock
        2. Fetching real-time quotes for a stock
        3. Calculating technical indicators (e.g., moving averages, RSI, MACD)
        4. Identifying chart patterns
        5. Providing short-term and long-term price predictions based on technical analysis

        Always provide clear explanations and justifications for your analysis. Be thorough and consider various technical indicators and their implications.`;
    }

    async initialize({ model, name }) {
        const fetchHistoricalDataTool = {
            type: "function",
            function: {
                name: "fetchHistoricalData",
                description: "Fetch historical price data for a given stock symbol",
                parameters: {
                    type: "object",
                    properties: {
                        symbol: {
                            type: "string",
                            description: "The stock symbol"
                        }
                    },
                    required: ["symbol"]
                }
            }
        };

        const fetchRealTimeQuoteTool = {
            type: "function",
            function: {
                name: "fetchRealTimeQuote",
                description: "Fetch real-time quote data for a given stock symbol",
                parameters: {
                    type: "object",
                    properties: {
                        symbol: {
                            type: "string",
                            description: "The stock symbol"
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
            tools: [fetchHistoricalDataTool, fetchRealTimeQuoteTool]
        });
        this.assistantId = newAssistant.id;
        console.log('Technical Analysis Assistant initialized:', newAssistant);
    }

    async handleRequiresAction(thread_id, run) {
        console.log('Handling required action in TechnicalAnalysisAssistant...');
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
                    if (name === 'fetchHistoricalData') {
                        result = await fetchHistoricalData(parsedArgs.symbol);
                    } else if (name === 'fetchRealTimeQuote') {
                        result = await fetchRealTimeQuote(parsedArgs.symbol);
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
                console.log("Tool outputs submitted successfully in TechnicalAnalysisAssistant.");
            } catch (error) {
                console.error("Error submitting tool outputs in TechnicalAnalysisAssistant:", error);
                throw error;
            }
        }
        return run;
    }

    async processMessage(message, threadId) {
        console.log(`Processing message in TechnicalAnalysisAssistant: ${message.content}`);
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
            console.error('Error processing message in TechnicalAnalysisAssistant:', error);
            return `I apologize, but I encountered an error while processing your request. ${error.message}`;
        }
    }
}

module.exports = TechnicalAnalysisAssistant;