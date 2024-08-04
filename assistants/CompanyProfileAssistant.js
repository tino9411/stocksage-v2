// utils/CompanyProfileAssistant.js
const BaseAssistantService = require('./BaseAssistantService');
const { fetchCompanyProfile } = require('../tools/fetchCompanyProfile');
const { fetchRealTimeQuote } = require('../tools/fetchRealTimeQuote');
const { fetchInsiderTradesSearch } = require('../tools/fetchInsiderTradesSearch');
const { 
    fetchAnalystEstimates, 
    fetchAnalystRecommendations, 
    fetchUpgradesDowngrades 
} = require('../tools/fetchAnalystInfoTools');

class CompanyProfileAssistant extends BaseAssistantService {
    constructor(apiKey) {
        super(apiKey);
        this.assistantId = null;
        this.assistantName = 'CompanyProfile';
        this.instructions = `You are a company profile and real-time quote specialist. Your role is to provide detailed information about companies and their current stock prices when requested. This includes:
        1. Company overview (history, mission, vision)
        2. Key products or services
        3. Market position and competitors
        4. Recent news or developments
        5. Key financial metrics (revenue, profit, market cap)
        6. Real-time stock quotes
        7. Insider trading information
        8. Analyst estimates
        9. Analyst recommendations
        10. Recent upgrades and downgrades
        
        Use the fetchCompanyProfile function to retrieve the most up-to-date information about a company.
        Use the fetchRealTimeQuote function to get the current stock price and related information.
        Use the fetchInsiderTradesSearch function to get insider trading information for a company.
        Use the fetchAnalystEstimates function to get analyst estimates for a company.
        Use the fetchAnalystRecommendations function to get analyst recommendations for a company.
        Use the fetchUpgradesDowngrades function to get recent upgrades and downgrades for a company.
        If the information is not available or there's an error, inform the user and provide any alternative information you can.
        Always provide concise but comprehensive information.`;
    }

    async initialize({ model, name }) {
        const fetchCompanyProfileTool = {
            type: "function",
            function: {
                name: "fetchCompanyProfile",
                description: "Fetch company profile information for a given stock symbol",
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

        const fetchInsiderTradesSearchTool = {
            type: "function",
            function: {
                name: "fetchInsiderTradesSearch",
                description: "Fetch insider trades data for a given stock symbol",
                parameters: {
                    type: "object",
                    properties: {
                        symbol: {
                            type: "string",
                            description: "The stock symbol"
                        },
                        page: {
                            type: "number",
                            description: "The page number for pagination (default is 0)"
                        }
                    },
                    required: ["symbol"]
                }
            }
        };

        const fetchAnalystEstimatesTool = {
            type: "function",
            function: {
                name: "fetchAnalystEstimates",
                description: "Fetch analyst estimates for a given stock symbol",
                parameters: {
                    type: "object",
                    properties: {
                        symbol: {
                            type: "string",
                            description: "The stock symbol"
                        },
                        period: {
                            type: "string",
                            description: "The period for estimates (annual or quarter)",
                            enum: ["annual", "quarter"]
                        },
                        limit: {
                            type: "number",
                            description: "The number of estimates to retrieve"
                        }
                    },
                    required: ["symbol"]
                }
            }
        };

        const fetchAnalystRecommendationsTool = {
            type: "function",
            function: {
                name: "fetchAnalystRecommendations",
                description: "Fetch analyst recommendations for a given stock symbol",
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

        const fetchUpgradesDowngradesTool = {
            type: "function",
            function: {
                name: "fetchUpgradesDowngrades",
                description: "Fetch recent upgrades and downgrades for a given stock symbol",
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
            tools: [
                fetchCompanyProfileTool, 
                fetchRealTimeQuoteTool, 
                fetchInsiderTradesSearchTool,
                fetchAnalystEstimatesTool,
                fetchAnalystRecommendationsTool,
                fetchUpgradesDowngradesTool
            ]
        });
        this.assistantId = newAssistant.id;
        console.log('Company Profile Assistant initialized:', newAssistant);
    }

    async processMessage(message, threadId) {
        console.log(`Processing message in CompanyProfileAssistant: ${message.content}`);
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
            console.error('Error processing message in CompanyProfileAssistant:', error);
            return `I apologize, but I encountered an error while processing your request. ${error.message}`;
        }
    }

    async handleRequiresAction(thread_id, run) {
        console.log('Handling required action in CompanyProfileAssistant...');
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
                    switch (name) {
                        case 'fetchCompanyProfile':
                            result = await fetchCompanyProfile(parsedArgs.symbol);
                            break;
                        case 'fetchRealTimeQuote':
                            result = await fetchRealTimeQuote(parsedArgs.symbol);
                            break;
                        case 'fetchInsiderTradesSearch':
                            result = await fetchInsiderTradesSearch(parsedArgs.symbol, parsedArgs.page || 0);
                            break;
                        case 'fetchAnalystEstimates':
                            result = await fetchAnalystEstimates(parsedArgs.symbol, parsedArgs.period, parsedArgs.limit);
                            break;
                        case 'fetchAnalystRecommendations':
                            result = await fetchAnalystRecommendations(parsedArgs.symbol);
                            break;
                        case 'fetchUpgradesDowngrades':
                            result = await fetchUpgradesDowngrades(parsedArgs.symbol);
                            break;
                        default:
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
                console.log("Tool outputs submitted successfully in CompanyProfileAssistant.");
            } catch (error) {
                console.error("Error submitting tool outputs in CompanyProfileAssistant:", error);
                throw error;
            }
        }
        return run;
    }

    async handleRunStatus(threadId, run) {
        while (run.status !== 'completed' && run.status !== 'failed') {
            if (run.status === 'requires_action') {
                run = await this.handleRequiresAction(threadId, run);
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before checking again
                run = await this.client.beta.threads.runs.retrieve(threadId, run.id);
            }
        }

        if (run.status === 'failed') {
            console.error('Run failed:', run.last_error);
            return `I apologize, but I encountered an error while processing your request. ${run.last_error.message}`;
        }

        const messages = await this.client.beta.threads.messages.list(threadId);
        const assistantResponse = messages.data.find(m => m.role === 'assistant');
        if (assistantResponse && assistantResponse.content[0].text) {
            return assistantResponse.content[0].text.value;
        }

        return 'I apologize, but I couldn\'t generate a response.';
    }
}

module.exports = CompanyProfileAssistant;