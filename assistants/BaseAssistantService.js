const OpenAI = require('openai');
const connectDB = require('../config/db');
const { EventEmitter } = require('events');
const Assistant = require('../models/Assistant');
const Thread = require('../models/Thread'); // Add this line to import the Thread model

class BaseAssistantService extends EventEmitter {
    constructor(apiKey) {
        super();
        this.apiKey = apiKey;
        this.client = new OpenAI({
            apiKey: this.apiKey,
        });
        this.dbConnected = false;
        this.logs = [];
        this.systemLogs = [];
        this.assistantId = null;
        this.assistantName = null;
        this.instructions = '';
    }

    addSystemLog(log) {
        const formattedLog = `[${new Date().toISOString()}] ${log}`;
        this.systemLogs.push(formattedLog);
        console.log(formattedLog);
    }

    getSystemLogs() {
        return this.systemLogs;
    }
    
    clearSystemLogs() {
        this.systemLogs = [];
    }

    addLog(log) {
        this.logs.push(log);
        console.log(log);
    }

    getLogs() {
        return this.logs;
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
            return assistant;
        } catch (error) {
            this.addSystemLog(`Error creating assistant: ${error.message}`);
            throw error;
        }
    }

    async listAssistants({ limit = 100, order = 'desc', after = null, before = null } = {}) {
        try {
            const assistants = await this.client.beta.assistants.list({
                limit,
                order,
                after,
                before,
            });
            return assistants.data;
        } catch (error) {
            this.addSystemLog(`Error listing assistants: ${error.message}`);
            throw error;
        }
    }

    async retrieveAssistant(assistant_id) {
        try {
            return await this.client.beta.assistants.retrieve(assistant_id);
        } catch (error) {
            this.addSystemLog(`Error retrieving assistant: ${error.message}`);
            throw error;
        }
    }

    async modifyAssistant(assistant_id, { model, name = null, description = null, instructions = null, tools = [], metadata = {}, temperature = 1.0, top_p = 1.0, response_format = 'auto' }) {
        try {
            const updateParams = {
                model,
                name,
                description,
                instructions,
                tools,
                metadata,
                temperature,
                top_p,
                response_format,
            };
            
            Object.keys(updateParams).forEach(key => updateParams[key] === null || updateParams[key] === undefined ? delete updateParams[key] : {});
            
            return await this.client.beta.assistants.update(assistant_id, updateParams);
        } catch (error) {
            this.addSystemLog(`Error modifying assistant: ${error.message}`);
            throw error;
        }
    }

    async deleteAssistant(assistantId) {
        try {
            return await this.client.beta.assistants.del(assistantId);
        } catch (error) {
            this.addSystemLog(`Error deleting assistant: ${error.message}`);
            throw error;
        }
    }

    async saveAssistantId(name, assistantId, model) {
        try {
            const assistant = await Assistant.findOneAndUpdate(
                { name },
                { assistantId, model, updated_at: new Date() },
                { upsert: true, new: true }
            );
            console.log(`Assistant ${name} saved with ID: ${assistantId}`);
            return assistant;
        } catch (error) {
            console.error(`Error saving assistant ${name}:`, error);
            throw error;
        }
    }
    
    async getAssistantId(name) {
        try {
            const assistant = await Assistant.findOne({ name });
            return assistant ? assistant.assistantId : null;
        } catch (error) {
            console.error(`Error getting assistant ID for ${name}:`, error);
            throw error;
        }
    }

    async createThread(userId) {
        try {
            const mainAssistant = await Assistant.findOne({ name: 'MAIN' });
            if (!mainAssistant) {
                throw new Error('Main assistant not found in database');
            }
    
            const thread = await this.client.beta.threads.create();
            this.setCurrentThreadId(thread.id);
    
            const newThread = await Thread.create({
                threadId: thread.id,
                user: userId,
                messages: []
            });
    
            return thread.id;
        } catch (error) {
            console.error('Failed to create thread:', error);
            throw error;
        }
    }

    async createMessage(thread_id, { role, content, attachments = [], metadata = {} }) {
        try {
            return await this.client.beta.threads.messages.create(thread_id, {
                role,
                content,
                attachments,
                metadata,
            });
        } catch (error) {
            this.addSystemLog(`Error creating message: ${error.message}`);
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
            this.addSystemLog(`Error listing messages: ${error.message}`);
            throw error;
        }
    }

    // Abstract methods to be implemented by subclasses
    async processMessage(message, thread_id) {
        throw new Error('processMessage must be implemented by subclass');
    }

    async handleRequiresAction(thread_id, run) {
        throw new Error('handleRequiresAction must be implemented by subclass');
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

    async initialize({ model, name }) {
        throw new Error('initialize must be implemented by subclass');
    }

    setCurrentThreadId(threadId) {
        this.currentThreadId = threadId;
    }
}

module.exports = BaseAssistantService;