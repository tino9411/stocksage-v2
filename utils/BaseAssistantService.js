//utils/BaseAssistantService.js
const OpenAI = require('openai');
const connectDB = require('../config/db');

class BaseAssistantService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.client = new OpenAI({
            apiKey: this.apiKey,
        });
        this.dbConnected = false;
    }

    async ensureDBConnection() {
        if (!this.dbConnected) {
            await connectDB();
            this.dbConnected = true;
        }
    }

    async createAssistant({ model, name = null, description = null, instructions = null, tools = [], metadata = {}, temperature = 1.0, top_p = 1.0, response_format = 'auto' }) {
        try {
            const assistant = await this.client.beta.assistants.create({
                model,
                name,
                description,
                instructions,
                tools,
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
                tools,
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

    async createThread({ messages = [], tool_resources = null, metadata = {} }) {
        try {
            const threadOptions = {
                tool_resources,
                metadata,
            };
            
            if (messages.length > 0) {
                threadOptions.messages = messages;
            }
    
            const thread = await this.client.beta.threads.create(threadOptions);
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

    async listMessages(thread_id, options = {}) {
        try {
            const { limit = 20, order = 'desc', after = null, before = null } = options;
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

    async processMessage(message, thread_id) {
        // This method should be implemented by each sub-assistant
        throw new Error('processMessage must be implemented by subclass');
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
                    const messages = await this.listMessages(thread_id);
                    const assistantMessages = messages.filter(message => message.role === 'assistant');
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

    async handleRequiresAction(thread_id, run) {
        // This method should be implemented by subclasses
        throw new Error('handleRequiresAction must be implemented by subclass');
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
                instructions: "Please respond to the user's message.",
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

module.exports = BaseAssistantService;