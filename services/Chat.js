// services/Chat.js

const Assistant = require('../models/Assistant');
const OpenAI = require('openai');
const EventEmitter = require('events');
const path = require('path');
const fs = require('fs');

class Chat extends EventEmitter {
    constructor(apiKey) {
        super();
        this.client = new OpenAI({ apiKey });
    }

    async createThread() {
        try {
          const mainAssistant = await Assistant.findOne({ name: 'MAIN' });
          if (!mainAssistant) {
            throw new Error('Main assistant not found in database');
          }
    
          const thread = await this.client.beta.threads.create();
          return thread.id;
        } catch (error) {
          console.error('Failed to create thread:', error);
          throw error;
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


    async sendMessage(threadId, userMessage) {
        if (!this.isInitialized) {
            throw new Error('Assistant not initialized. Please call initializeAssistant first.');
        }
        const thread = this.threads.get(threadId);
        if (!thread) {
            throw new Error('Thread not found');
        }
        try {
            const response = await this.mainAssistant.chatWithAssistant(threadId, this.mainAssistant.assistantId, userMessage);
            return {
                message: response,
                logs: this.mainAssistant.getAndClearSystemLogs()
            };
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        }
    }

    async streamMessage(threadId, userMessage, onEvent) {
        if (!this.isInitialized) {
            throw new Error('Assistant not initialized. Please call initializeAssistant first.');
        }
        const thread = this.threads.get(threadId);
        if (!thread) {
            throw new Error('Thread not found');
        }
        try {
            await this.mainAssistant.createMessage(threadId, { role: 'user', content: userMessage });
            const { assistantId } = this.mainAssistant;
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

    async observeStream(stream, onEvent) {
        this.currentStream = stream;
        stream.on('textDelta', (delta) => onEvent({ type: 'textDelta', data: delta }));
        stream.on('toolCallCreated', (toolCall) => onEvent({ type: 'toolCallCreated', data: toolCall }));
        stream.on('toolCallDelta', (toolCallDelta, snapshot) => onEvent({ type: 'toolCallDelta', data: { delta: toolCallDelta, snapshot } }));
        stream.on('end', async () => {
            const currentRun = stream.currentRun();
            if (currentRun && currentRun.status === "requires_action" && currentRun.required_action.type === "submit_tool_outputs") {
                const toolCalls = currentRun.required_action.submit_tool_outputs.tool_calls;
                await this.handleToolCalls(stream.threadId, toolCalls, currentRun.id, onEvent);
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

    async addFilesToConversation(threadId, files) {
        if (!this.isInitialized) {
            throw new Error('Assistant not initialized. Please call initializeAssistant first.');
        }
        const thread = this.threads.get(threadId);
        if (!thread) {
            throw new Error('Thread not found');
        }
        try {
            const uploadedFiles = await this.mainAssistant.addFilesToConversation(files);
            return uploadedFiles;
        } catch (error) {
            console.error('Failed to add files to conversation:', error);
            throw error;
        }
    }

    async deleteFileFromConversation(threadId, fileId) {
        if (!this.isInitialized) {
            throw new Error('Assistant not initialized. Please call initializeAssistant first.');
        }
        const thread = this.threads.get(threadId);
        if (!thread) {
            throw new Error('Thread not found');
        }
        try {
            const vectorStoreId = await this.mainAssistant.getVectorStoreIdForThread(threadId);
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

    async endConversation(threadId) {
        if (!this.isInitialized) {
            throw new Error('Assistant not initialized. Please call initializeAssistant first.');
        }
        const thread = this.threads.get(threadId);
        if (!thread) {
            throw new Error('Thread not found');
        }
        try {
            await this.mainAssistant.deleteThread(threadId);
            this.threads.delete(threadId);
            return this.mainAssistant.getAndClearSystemLogs();
        } catch (error) {
            console.error('Failed to end conversation:', error);
            throw error;
        }
    }

    async shutDown() {
        if (this.mainAssistant) {
            await this.mainAssistant.deleteAllAssistants();
            this.resetState();
        }
        return this.mainAssistant ? this.mainAssistant.getAndClearSystemLogs() : [];
    }

    resetState() {
        this.mainAssistant = null;
        this.threads.clear();
        this.isInitialized = false;
    }
}

module.exports = Chat;