//utils/CompanyProfileAssistant.js
const BaseAssistantService = require('./BaseAssistantService');
const { fetchCompanyProfile } = require('../services/fetchCompanyProfile');

class CompanyProfileAssistant extends BaseAssistantService {
    constructor(apiKey) {
        super(apiKey);
        this.assistantId = null;
        this.assistantName = 'CompanyProfile';
        this.instructions = `You are a company profile specialist. Your role is to provide detailed information about companies when requested. This includes:
        1. Company overview (history, mission, vision)
        2. Key products or services
        3. Market position and competitors
        4. Recent news or developments
        5. Key financial metrics (revenue, profit, market cap)
        
        Use the fetchCompanyProfile function to retrieve the most up-to-date information about a company.
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

        const newAssistant = await this.createAssistant({
            model,
            name,
            instructions: this.instructions,
            tools: [fetchCompanyProfileTool]
        });
        this.assistantId = newAssistant.id;
        console.log('Company Profile Assistant initialized:', newAssistant);
    }

    async handleRequiresAction(thread_id, run) {
        this.addSystemLog('Handling required action in CompanyProfileAssistant...');
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
                    if (name === 'fetchCompanyProfile') {
                        result = await fetchCompanyProfile(parsedArgs.symbol);
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
                console.log("Tool outputs submitted successfully in CompanyProfileAssistant.");
            } catch (error) {
                console.error("Error submitting tool outputs in CompanyProfileAssistant:", error);
                throw error;
            }
        }
        return run;
    }

    async processMessage(message, threadId) {
        this.addSystemLog(`Processing message in CompanyProfileAssistant: ${message.content}`);
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

}

module.exports = CompanyProfileAssistant;