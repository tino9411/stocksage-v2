const OpenAI = require('openai');
const { fetchCompanyProfile } = require('../tools/fetchCompanyProfile');
const { fetchRealTimeQuote } = require('../tools/fetchRealTimeQuote');
const { fetchHistoricalData } = require('../tools/fetchHistoricalData');
const { fetchKeyMetrics } = require('../tools/fetchKeyMetrics');
const { fetchIncomeStatement } = require('../tools/fetchIncomeStatement');
const { fetchCashFlowStatement } = require('../tools/fetchCashFlowStatement');
const { fetchBalanceSheet } = require('../tools/fetchBalanceSheet');
const { calculateTechnicalIndicators } = require('../tools/calculateTechnicalIndicators');
const connectDB = require('../config/db');

class AssistantService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.client = new OpenAI({
            apiKey: this.apiKey,
        });
        this.tools = {
            fetchCompanyProfile,
            fetchRealTimeQuote,
            fetchHistoricalData,
            fetchKeyMetrics,
            fetchIncomeStatement,
            fetchCashFlowStatement,
            fetchBalanceSheet,
            calculateTechnicalIndicators
        };
        this.dbConnected = false;
    }

    async ensureDBConnection() {
        if (!this.dbConnected) {
            await connectDB();
            this.dbConnected = true;
        }
    }

    async createAssistant({ model, name = null, description = null, instructions = null, metadata = {}, temperature = 1.0, top_p = 1.0, response_format = 'auto' }) {
        try {
            const formattedTools = Object.keys(this.tools).map(toolName => ({
                type: 'function',
                function: {
                    name: toolName,
                    description: `Executes the ${toolName} function`,
                    parameters: {
                        type: 'object',
                        properties: {
                            symbol: {
                                type: 'string',
                                description: 'The stock symbol of the company'
                            }
                        },
                        required: ['symbol']
                    }
                }
            }));

            const assistant = await this.client.beta.assistants.create({
                model,
                name,
                description,
                instructions,
                tools: formattedTools,
                metadata,
                temperature,
                top_p,
                response_format,
            });
            console.log('Created Assistant:', JSON.stringify(assistant, null, 2));
            return assistant;
        } catch (error) {
            console.error('Error creating assistant:', error);
            throw error;
        }
    }


    async listAssistants({ limit = 20, order = 'desc', after = null, before = null }) {
        try {
            const assistants = await this.client.beta.assistants.list({
                limit,
                order,
                after,
                before,
            });
            return assistants.data;
        } catch (error) {
            console.error('Error listing assistants:', error);
            throw error;
        }
    }

    async retrieveAssistant(assistant_id) {
        try {
            const assistant = await this.client.beta.assistants.retrieve(assistant_id);
            return assistant;
        } catch (error) {
            console.error('Error retrieving assistant:', error);
            throw error;
        }
    }

    async modifyAssistant(assistant_id, { model, name = null, description = null, instructions = null, tools = [], metadata = {}, temperature = 1.0, top_p = 1.0, response_format = 'auto' }) {
        try {
            const updatedAssistant = await this.client.beta.assistants.update(assistant_id, {
                model,
                name,
                description,
                instructions,
                tools: tools.map(tool => ({ type: 'function', name: tool })),
                metadata,
                temperature,
                top_p,
                response_format,
            });
            return updatedAssistant;
        } catch (error) {
            console.error('Error modifying assistant:', error);
            throw error;
        }
    }

    async deleteAssistant(assistant_id) {
        try {
            const response = await this.client.beta.assistants.del(assistant_id);
            return response;
        } catch (error) {
            console.error('Error deleting assistant:', error);
            throw error;
        }
    }

    async executeTool(toolName, ...params) {
        if (!this.tools[toolName]) {
            throw new Error(`Tool ${toolName} not found`);
        }
    
        try {
            const result = await this.tools[toolName](...params);
            return result;
        } catch (error) {
            console.error('Error executing tool:', error);
            throw error;
        }
    }

    getAvailableTools() {
        return Object.keys(this.tools);
    }

    async createThread({ messages = [], tool_resources = null, metadata = {} }) {
        try {
            const thread = await this.client.beta.threads.create({
                messages,
                tool_resources,
                metadata,
            });
            return thread;
        } catch (error) {
            console.error('Error creating thread:', error);
            throw error;
        }
    }

    async retrieveThread(thread_id) {
        try {
            const thread = await this.client.beta.threads.retrieve(thread_id);
            return thread;
        } catch (error) {
            console.error('Error retrieving thread:', error);
            throw error;
        }
    }

    async modifyThread(thread_id, { tool_resources = null, metadata = {} }) {
        try {
            const updatedThread = await this.client.beta.threads.update(thread_id, {
                tool_resources,
                metadata,
            });
            return updatedThread;
        } catch (error) {
            console.error('Error modifying thread:', error);
            throw error;
        }
    }

    async deleteThread(thread_id) {
        try {
            const response = await this.client.beta.threads.del(thread_id);
            return response;
        } catch (error) {
            console.error('Error deleting thread:', error);
            throw error;
        }
    }

    async createMessage(thread_id, { role, content, attachments = [], metadata = {} }) {
        try {
            const message = await this.client.beta.threads.messages.create(thread_id, {
                role,
                content,
                attachments,
                metadata,
            });
            return message;
        } catch (error) {
            console.error('Error creating message:', error);
            throw error;
        }
    }

    async listMessages(thread_id, { limit = 20, order = 'desc', after = null, before = null }) {
        try {
            const messages = await this.client.beta.threads.messages.list(thread_id, {
                limit,
                order,
                after,
                before,
            });
            return messages.data;
        } catch (error) {
            console.error('Error listing messages:', error);
            throw error;
        }
    }

    async retrieveMessage(thread_id, message_id) {
        try {
            const message = await this.client.beta.threads.messages.retrieve(thread_id, message_id);
            return message;
        } catch (error) {
            console.error('Error retrieving message:', error);
            throw error;
        }
    }

    async modifyMessage(thread_id, message_id, { metadata = {} }) {
        try {
            const updatedMessage = await this.client.beta.threads.messages.update(thread_id, message_id, {
                metadata,
            });
            return updatedMessage;
        } catch (error) {
            console.error('Error modifying message:', error);
            throw error;
        }
    }

    async deleteMessage(thread_id, message_id) {
        try {
            const response = await this.client.beta.threads.messages.del(thread_id, message_id);
            return response;
        } catch (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    }

    async handleRequiresAction(thread_id, run) {
        console.log('Handling required action...');
        if (
            run.required_action &&
            run.required_action.submit_tool_outputs &&
            run.required_action.submit_tool_outputs.tool_calls
        ) {
            await this.ensureDBConnection();

            const toolOutputs = await Promise.all(run.required_action.submit_tool_outputs.tool_calls.map(async (tool) => {
                const { id, function: { name, arguments: args } } = tool;
                const parsedArgs = JSON.parse(args);
                try {
                    const result = await this.tools[name](parsedArgs.symbol);
                    console.log(`Tool ${name} executed successfully for symbol ${parsedArgs.symbol}`);
                    return {
                        tool_call_id: id,
                        output: JSON.stringify(result), // Return the actual result
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
                console.log("Tool outputs submitted successfully.");
            } catch (error) {
                console.error("Error submitting tool outputs:", error);
                throw error;
            }
        }
        return run;
    }

    async handleRunStatus(thread_id, run) {
        console.log('Handling run status...');
        while (true) {
            console.log(`Current run status: ${run.status}`);
            switch (run.status) {
                case 'queued':
                case 'in_progress':
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    run = await this.client.beta.threads.runs.retrieve(thread_id, run.id);
                    break;
                case 'requires_action':
                    run = await this.handleRequiresAction(thread_id, run);
                    break;
                case 'completed':
                    console.log('Run completed. Retrieving messages...');
                    const messages = await this.client.beta.threads.messages.list(thread_id);
                    const assistantMessages = messages.data.filter(message => message.role === 'assistant');
                    if (assistantMessages.length > 0) {
                        const latestMessage = assistantMessages[0].content[0].text.value;
                        console.log('Assistant response:', latestMessage);
                        return latestMessage;
                    } else {
                        console.log('No assistant messages found');
                        return null;
                    }
                case 'failed':
                case 'cancelled':
                case 'expired':
                    console.error(`Run ended with status: ${run.status}`);
                    return null;
                default:
                    console.error(`Unknown run status: ${run.status}`);
                    return null;
            }
        }
    }

    async chatWithAssistant(thread_id, assistant_id, userMessage) {
        console.log(`Starting chat with assistant ${assistant_id} in thread ${thread_id}`);
        try {
            await this.createMessage(thread_id, {
                role: 'user',
                content: userMessage,
            });
            console.log('User message added to thread');

            let run = await this.client.beta.threads.runs.create(thread_id, {
                assistant_id,
                instructions: "Please respond to the user's message. Use the provided tools when necessary to fetch financial data or perform calculations.",
            });

            const response = await this.handleRunStatus(thread_id, run);
            
            if (response) {
                console.log('Assistant response:', response);
                return response;
            } else {
                console.log('No assistant response found');
                return null;
            }
        } catch (error) {
            console.error('Error in chatWithAssistant:', error);
            throw error;
        }
    }
}

module.exports = AssistantService;