const MainAssistantService = require('../assistants/MainAssistantService');
const OpenAI = require('openai');
const EventEmitter = require('events');
const path = require('path');
const fs = require('fs');

class Chat extends EventEmitter {
    constructor(apiKey) {
        super();
        this.apiKey = apiKey;
        this.mainAssistant = null;
        this.threadId = null;
        this.isInitialized = false;
        this.isConversationStarted = false;
        this.currentStream = null;
    }

    async initializeAssistant({ model, name, files = [] }) {
        if (!this.isInitialized) {
            try {
                this.mainAssistant = new MainAssistantService(this.apiKey);
                await this.mainAssistant.initialize({ model, name });
                
                if (files.length > 0) {
                    await this.addFilesToAssistant(files);
                }
                
                this.isInitialized = true;
                return this.mainAssistant.getAndClearSystemLogs();
            } catch (error) {
                console.error('Failed to initialize assistant:', error);
                this.isInitialized = false;
                throw error;
            }
        }
    }

    async addFilesToAssistant(files) {
        try {
            const vectorStoreName = "InitialVectorStore";
            const vectorStoreId = await this.mainAssistant.uploadFilesAndCreateVectorStore(vectorStoreName, files);
            const uploadedFiles = await this.mainAssistant.listVectorStoreFiles(vectorStoreId);
            return uploadedFiles.map(file => ({ id: file.id, name: file.filename }));
        } catch (error) {
            console.error('Failed to add files to assistant:', error);
            throw error;
        }
    }

    async startConversation(initialMessage) {
        this.ensureInitialized();
        if (!this.isConversationStarted) {
            const newThread = await this.createNewThread(initialMessage);
            this.threadId = newThread.id;
            this.mainAssistant.currentThreadId = this.threadId; // Set the currentThreadId in MainAssistantService
            this.isConversationStarted = true;
            return await this.sendMessage(initialMessage);
        }
    }

    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('Assistant not initialized. Please call initializeAssistant first.');
        }
    }

    ensureConversationStarted() {
        if (!this.isInitialized || !this.isConversationStarted) {
            throw new Error('Assistant not initialized or conversation not started. Please call initializeAssistant and startConversation first.');
        }
    }

    async createNewThread(initialMessage) {
        return await this.mainAssistant.createThread({
            messages: [{ role: 'user', content: initialMessage }],
            metadata: { topic: 'Chat' },
        });
    }

    async sendMessage(userMessage) {
        this.ensureConversationStarted();
        const response = await this.mainAssistant.chatWithAssistant(this.threadId, this.mainAssistant.assistantId, userMessage);
        return {
            message: response,
            logs: this.mainAssistant.getAndClearSystemLogs()
        };
    }

    async streamMessage(userMessage, onEvent) {
        this.ensureConversationStarted();
        try {
            await this.mainAssistant.createMessage(this.threadId, { role: 'user', content: userMessage });
            const { assistantId, threadId } = this.getStreamParameters();
            const stream = await this.mainAssistant.client.beta.threads.runs.createAndStream(threadId, { assistant_id: assistantId });
            await this.observeStream(stream, onEvent);
            const finalMessages = await stream.finalMessages();
            console.log('[streamMessage] Final messages:', finalMessages);
        } catch (error) {
            console.error('[streamMessage] Error:', error);
            onEvent({ type: 'error', data: error.message });
            throw error;
        }
    }

    getStreamParameters() {
        const assistantId = this.mainAssistant.assistantId;
        const threadId = this.threadId;
        if (!assistantId || !threadId) {
            console.error('[streamMessage] Missing parameter:', { assistantId, threadId });
            throw new Error('Missing required parameter.');
        }
        return { assistantId, threadId };
    }

    async observeStream(stream, onEvent) {
        this.currentStream = stream;
        stream.on('textDelta', (delta) => onEvent({ type: 'textDelta', data: delta }));
        stream.on('toolCallCreated', (toolCall) => onEvent({ type: 'toolCallCreated', data: toolCall }));
        stream.on('toolCallDelta', (toolCallDelta, snapshot) => onEvent({ type: 'toolCallDelta', data: { delta: toolCallDelta, snapshot } }));
        stream.on('end', async () => {
            const currentRun = stream.currentRun();
            if (currentRun && currentRun.status === "requires_action" && currentRun.required_action.type === "submit_tool_outputs") {
                const toolCalls = currentRun.required_action.submit_tool_outputs.tool_calls;
                await this.handleToolCalls(this.threadId, toolCalls, currentRun.id, onEvent);
            }
            onEvent({ type: 'end' });
        });
        stream.on('error', (err) => onEvent({ type: 'error', data: err.message }));
        return stream.finalMessages();
    }

    async handleToolCalls(threadId, toolCalls, runId, onEvent) {
        try {
            const toolOutputs = await Promise.all(toolCalls.map(async (toolCall) => {
                onEvent({ type: 'toolCallCreated', data: { id: toolCall.id, function: { name: toolCall.function.name, arguments: toolCall.function.arguments } } });
                const result = await this.mainAssistant.executeToolCall(toolCall);
                onEvent({ type: 'toolCallCompleted', data: { id: toolCall.id, function: { name: toolCall.function.name, arguments: toolCall.function.arguments }, output: result } });
                return { tool_call_id: toolCall.id, output: JSON.stringify(result) };
            }));
            const stream = await this.mainAssistant.client.beta.threads.runs.submitToolOutputsStream(threadId, runId, { tool_outputs: toolOutputs });
            await this.observeStream(stream, onEvent);
        } catch (error) {
            console.error('[handleToolCalls] Error handling tool calls:', error);
            onEvent({ type: 'error', data: error.message });
        }
    }

    async addFilesToConversation(files) {
        this.ensureConversationStarted();
        try {
            const uploadedFiles = await this.mainAssistant.addFilesToConversation(files);
            return uploadedFiles;
        } catch (error) {
            console.error('Failed to add files to conversation:', error);
            throw error;
        }
    }

    async deleteFileFromConversation(fileId) {
    this.ensureConversationStarted();
    try {
        const vectorStoreId = await this.mainAssistant.getVectorStoreIdForThread(this.threadId);
        if (!vectorStoreId) {
            throw new Error('No vector store found for this conversation');
        }
        
        // Add a small delay to ensure the file is fully processed
        await new Promise(resolve => setTimeout(resolve, 2000));

        // First, try to delete the file from the vector store
        try {
            await this.mainAssistant.deleteVectorStoreFile(vectorStoreId, fileId);
        } catch (error) {
            if (error.status === 404) {
                // If file not found in vector store, try deleting it directly
                await this.mainAssistant.deleteFile(fileId);
            } else {
                throw error;
            }
        }

        return { message: 'File deleted successfully', logs: this.mainAssistant.getAndClearSystemLogs() };
    } catch (error) {
        console.error('Failed to delete file from conversation:', error);
        throw error;
    }
}

    async endConversation() {
        if (this.mainAssistant) {
            await this.mainAssistant.deleteAllAssistants();
            this.resetConversationState();
        }
        return this.mainAssistant ? this.mainAssistant.getAndClearSystemLogs() : [];
    }

    resetConversationState() {
        this.mainAssistant = null;
        this.threadId = null;
        this.isInitialized = false;
        this.isConversationStarted = false;
    }
}

module.exports = Chat;