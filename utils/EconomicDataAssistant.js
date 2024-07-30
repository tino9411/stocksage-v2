// utils/EconomicDataAssistant.js
const BaseAssistantService = require('./BaseAssistantService');
const { 
    fetchTreasuryRates, 
    fetchEconomicIndicators, 
    fetchEconomicCalendar, 
    fetchMarketRiskPremium 
} = require('../services/EconomicDataTools');

class EconomicDataAssistant extends BaseAssistantService {
    constructor(apiKey) {
        super(apiKey);
        this.assistantId = null;
        this.assistantName = 'EconomicData';
        this.instructions = `You are an economic data specialist. Your role is to provide detailed economic information when requested. This includes:
        1. Treasury rates
        2. Economic indicators
        3. Economic calendar events
        4. Market risk premiums

        Use the provided functions to retrieve the most up-to-date economic information for the last 5 years:
        - fetchTreasuryRates: Get Treasury rates for the last 5 years
        - fetchEconomicIndicators: Get data for various economic indicators for the last 5 years
        - fetchEconomicCalendar: Get economic events for the last 5 years
        - fetchMarketRiskPremium: Get the current market risk premium

        If the information is not available or there's an error, inform the user and provide any alternative information you can.
        Always provide concise but comprehensive information.`;
    }

    async initialize({ model, name }) {
        const tools = [
            this.createTreasuryRatesTool(),
            this.createEconomicIndicatorsTool(),
            this.createEconomicCalendarTool(),
            this.createMarketRiskPremiumTool()
        ];

        const newAssistant = await this.createAssistant({
            model,
            name,
            instructions: this.instructions,
            tools: tools
        });
        this.assistantId = newAssistant.id;
        console.log('Economic Data Assistant initialized:', newAssistant);
    }

    createTreasuryRatesTool() {
        return {
            type: "function",
            function: {
                name: "fetchTreasuryRates",
                description: "Fetch Treasury rates for the last 5 years",
                parameters: {
                    type: "object",
                    properties: {}
                }
            }
        };
    }

    createEconomicIndicatorsTool() {
        return {
            type: "function",
            function: {
                name: "fetchEconomicIndicators",
                description: "Fetch economic indicators for a given name for the last 5 years",
                parameters: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "Name of the economic indicator"
                        }
                    },
                    required: ["name"]
                }
            }
        };
    }

    createEconomicCalendarTool() {
        return {
            type: "function",
            function: {
                name: "fetchEconomicCalendar",
                description: "Fetch economic calendar events for the last 5 years",
                parameters: {
                    type: "object",
                    properties: {}
                }
            }
        };
    }

    createMarketRiskPremiumTool() {
        return {
            type: "function",
            function: {
                name: "fetchMarketRiskPremium",
                description: "Fetch the current market risk premium",
                parameters: {
                    type: "object",
                    properties: {}
                }
            }
        };
    }

    async processMessage(message, threadId) {
        console.log(`Processing message in EconomicDataAssistant: ${message.content}`);
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
            console.error('Error processing message in EconomicDataAssistant:', error);
            return `I apologize, but I encountered an error while processing your request. ${error.message}`;
        }
    }

    async handleRequiresAction(thread_id, run) {
        console.log('Handling required action in EconomicDataAssistant...');
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
                        case 'fetchTreasuryRates':
                            result = await fetchTreasuryRates();
                            break;
                        case 'fetchEconomicIndicators':
                            result = await fetchEconomicIndicators(parsedArgs.name);
                            break;
                        case 'fetchEconomicCalendar':
                            result = await fetchEconomicCalendar();
                            break;
                        case 'fetchMarketRiskPremium':
                            result = await fetchMarketRiskPremium();
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
                console.log("Tool outputs submitted successfully in EconomicDataAssistant.");
            } catch (error) {
                console.error("Error submitting tool outputs in EconomicDataAssistant:", error);
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

module.exports = EconomicDataAssistant;