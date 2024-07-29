// utils/CompanyProfileAssistant.js
const BaseAssistantService = require('./BaseAssistantService');
const { fetchCompanyProfile } = require('../services/fetchCompanyProfile');

class CompanyProfileAssistant extends BaseAssistantService {
    // Constructor to initialize the CompanyProfileAssistant instance
    constructor(apiKey) {
        super(apiKey); // Call the parent class constructor
        this.assistantId = null; // Store the assistant's ID
        this.assistantName = 'CompanyProfile'; // Name of the assistant
        this.instructions = this.getInstructions(); // Instructions for the assistant
    }

    // Method to get instructions for the assistant
    getInstructions() {
        return `You are a company profile specialist. Your role is to provide detailed information about companies when requested. This includes:
        1. Company overview (history, mission, vision)
        2. Key products or services
        3. Market position and competitors
        4. Recent news or developments
        5. Key financial metrics (revenue, profit, market cap)
        
        Use the fetchCompanyProfile function to retrieve the most up-to-date information about a company.
        If the information is not available or there's an error, inform the user and provide any alternative information you can.
        Always provide concise but comprehensive information.`;
    }

    // Method to initialize the assistant
    async initialize({ model, name }) {
        this.addSystemLog('Initializing Company Profile Assistant');
        const fetchTools = this.createTools();
        const newAssistant = await this.createAssistant({
            model,
            name,
            instructions: this.instructions,
            tools: [fetchTools]
        });
        this.assistantId = newAssistant.id; // Store the assistant's ID
        console.log('Company Profile Assistant initialized:', newAssistant);
    }

    // Method to create the fetch company profile tool
    createTools() {
        return {
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
    }

    // Method to handle required actions in the assistant
    async handleRequiresAction(thread_id, run) {
        this.addSystemLog('Handling required action in CompanyProfileAssistant...');
        if (this.hasToolCalls(run)) {
            const toolOutputs = await this.executeToolCalls(run.required_action.submit_tool_outputs.tool_calls);
            return await this.submitToolOutputs(thread_id, run.id, toolOutputs);
        }
        return run;
    }

    // Method to check if there are tool calls to be executed
    hasToolCalls(run) {
        return run.required_action && run.required_action.submit_tool_outputs && run.required_action.submit_tool_outputs.tool_calls;
    }

    // Method to execute tool calls
    async executeToolCalls(toolCalls) {
        return await Promise.all(toolCalls.map(async (tool) => {
            const { id, function: { name, arguments: args } } = tool;
            const parsedArgs = JSON.parse(args);
            try {
                let result;
                if (name === 'fetchCompanyProfile') {
                    result = await fetchCompanyProfile(parsedArgs.symbol);
                } else {
                    throw new Error(`Unknown function ${name}`);
                }
                console.log(`Tool result for ${name} with symbol ${parsedArgs.symbol}:`, result); // Log the tool result
                return this.createToolOutput(id, result);
            } catch (error) {
                console.error(`Error executing tool ${name}:`, error);
                return this.createToolOutput(id, { error: error.message });
            }
        }));
    }

    // Method to create tool output
    createToolOutput(tool_call_id, result) {
        const output = {
            tool_call_id,
            output: JSON.stringify(result),
        };
        console.log(`Created tool output:`, output); // Log the created tool output
        return output;
    }

    // Method to submit tool outputs
    async submitToolOutputs(thread_id, run_id, toolOutputs) {
        try {
            console.log(`Submitting tool outputs for thread ${thread_id}, run ${run_id}:`, toolOutputs); // Log the tool outputs being submitted
            await this.client.beta.threads.runs.submitToolOutputsStream(
                thread_id,
                run_id,
                { tool_outputs: toolOutputs },
            );
            console.log("Tool outputs submitted successfully in CompanyProfileAssistant.");
        } catch (error) {
            console.error("Error submitting tool outputs in CompanyProfileAssistant:", error);
            throw error;
        }
    }

    // Method to process incoming messages
    async processMessage(message, threadId, stream = false) {
        this.addSystemLog(`Processing message in CompanyProfileAssistant: ${message.content}`);
        try {
            await this.createUserMessage(threadId, message.content);
            let run = await this.createAssistantRun(threadId, stream);
            run = await this.handleRunStatus(threadId, run, stream);
            return run;
        } catch (error) {
            console.error('Error processing message in CompanyProfileAssistant:', error);
            return `I apologize, but I encountered an error while processing your request. ${error.message}`;
        }
    }

    // Method to create a user message in the thread
    async createUserMessage(threadId, content) {
        await this.createMessage(threadId, {
            role: 'user',
            content,
        });
    }

    // Method to create a new run for the assistant
    async createAssistantRun(threadId, stream) {
        this.addSystemLog(`Creating new run for CompanyProfile Assistant on thread: ${threadId}`);
        return await this.client.beta.threads.runs.create(threadId, {
            assistant_id: this.assistantId,
            stream: stream
        });
    }

    // Method to handle run status
    async handleRunStatus(threadId, run, stream) {
        if (!run) {
            console.error('Run object is undefined');
            return null;
        }

        if (stream) {
            return run;
        }

        if (this.hasToolCalls(run)) {
            return await this.handleRequiresAction(threadId, run);
        }

        const messages = await this.client.beta.threads.messages.list(threadId);
        const assistantResponse = messages.data.find(m => m.role === 'assistant');
        if (assistantResponse) {
            return assistantResponse.content[0].text;
        }

        return `Unable to process the request.`;
    }
}

module.exports = CompanyProfileAssistant;