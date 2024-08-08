// services/Chat.js

const Assistant = require('../models/Assistant');
const OpenAI = require('openai');
const EventEmitter = require('events');
const path = require('path');
const fs = require('fs');
const ToolExecutor = require('./toolExecutor');

class Chat extends EventEmitter {
    constructor(apiKey) {
        super();
        this.client = new OpenAI({ apiKey });
        this.toolExecutor = new ToolExecutor(this);
        this.assistantId = null;
        this.assistantName = null;
        this.subAssistants = {};
        this.subAssistantThreads = {};
        this.threadVectorStores = {};
        this.currentThreadId = null;
    }

    setCurrentThreadId(threadId) {
        this.currentThreadId = threadId;
    }

    clearCurrentThreadId() {
        this.currentThreadId = null;
    }

    async createThread() {
        try {
            const mainAssistant = await Assistant.findOne({ name: 'MAIN' });
            if (!mainAssistant) {
                throw new Error('Main assistant not found in database');
            }

            const thread = await this.client.beta.threads.create();
            this.setCurrentThreadId(thread.id);
            return thread.id;
        } catch (error) {
            console.error('Failed to create thread:', error);
            throw error;
        }
    }

    async streamMessage(threadId, userMessage, onEvent) {
        try {
            const mainAssistant = await Assistant.findOne({ name: 'MAIN' });
            if (!mainAssistant) {
                throw new Error('Main assistant not found in database');
            }

            this.setCurrentThreadId(threadId);

            await this.client.beta.threads.messages.create(threadId, {
                role: 'user',
                content: userMessage
            });

            const stream = await this.client.beta.threads.runs.createAndStream(
                threadId,
                { assistant_id: mainAssistant.assistantId }
            );

            await this.observeStream(stream, onEvent);
            const finalMessages = await stream.finalMessages();
            console.log('[streamMessage] Final messages:', finalMessages);
        } catch (error) {
            console.error('[streamMessage] Error:', error);
            onEvent({ type: 'error', data: error.message });
            throw error;
        } finally {
            this.clearCurrentThreadId();
        }
    }

    async observeStream(stream, onEvent) {
        stream.on('textDelta', (delta) => onEvent({ type: 'textDelta', data: delta }));
        stream.on('toolCallCreated', (toolCall) => onEvent({ type: 'toolCallCreated', data: toolCall }));
        stream.on('toolCallDelta', (toolCallDelta, snapshot) => onEvent({ type: 'toolCallDelta', data: { delta: toolCallDelta, snapshot } }));
        stream.on('end', async () => {
            const currentRun = stream.currentRun();
            if (currentRun && currentRun.status === "requires_action" && currentRun.required_action.type === "submit_tool_outputs") {
                const toolCalls = currentRun.required_action.submit_tool_outputs.tool_calls;
                await this.handleToolCalls(this.currentThreadId, toolCalls, currentRun.id, onEvent);
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
                const result = await this.toolExecutor.executeToolCall(toolCall);
                onEvent({ type: 'toolCallCompleted', data: { id: toolCall.id, function: { name: toolCall.function.name, arguments: toolCall.function.arguments }, output: result.output } });
                return result;
            }));
            
            const stream = await this.client.beta.threads.runs.submitToolOutputsStream(
                threadId,
                runId,
                { tool_outputs: toolOutputs }
            );
            await this.observeStream(stream, onEvent);
        } catch (error) {
            console.error('[handleToolCalls] Error handling tool calls:', error);
            onEvent({ type: 'error', data: error.message });
        }
    }

    async uploadAndProcessFile(filePath) {
        console.log(`Uploading file: ${filePath}`);
        const fileName = path.basename(filePath);
        const fileStream = fs.createReadStream(filePath);
        try {
            const file = await this.client.files.create({
                file: fileStream,
                purpose: 'assistants',
            });
            console.log(`File uploaded successfully: ${file.id}`);
            return { id: file.id, name: fileName };
        } catch (error) {
            console.error(`Error uploading file: ${error.message}`);
            throw error;
        }
    }

    async uploadFilesAndCreateVectorStore(name, filePaths) {
        console.log(`Uploading files and creating vector store: ${name}`);
        try {
            const uploadedFiles = await Promise.all(filePaths.map(filePath => this.uploadAndProcessFile(filePath)));
            const vectorStore = await this.client.beta.vectorStores.create({
                name: name,
                file_ids: uploadedFiles.map(file => file.id)
            });
            await this.client.beta.vectorStores.fileBatches.createAndPoll(vectorStore.id, {
                file_ids: uploadedFiles.map(file => file.id)
            });
            await this.attachVectorStoreToAssistant(vectorStore.id);
            console.log(`Vector store created and attached: ${vectorStore.id}`);
            return vectorStore.id;
        } catch (error) {
            console.error(`Error uploading files and creating vector store: ${error.message}`);
            throw error;
        }
    }

    async attachVectorStoreToAssistant(vectorStoreId) {
        try {
            const mainAssistant = await Assistant.findOne({ name: 'MAIN' });
            if (!mainAssistant) {
                throw new Error('Main assistant not found in database');
            }
            await this.client.beta.assistants.update(mainAssistant.assistantId, {
                tool_resources: { 
                    file_search: { 
                        vector_store_ids: [vectorStoreId] 
                    } 
                }
            });
            console.log(`Vector store ${vectorStoreId} attached to assistant ${mainAssistant.assistantId}`);
        } catch (error) {
            console.error(`Error attaching vector store to assistant: ${error.message}`);
            throw error;
        }
    }

    async createNewThread(subAssistantName) {
        const newThread = await this.client.beta.threads.create({ metadata: { subAssistant: subAssistantName } });
        this.subAssistantThreads[subAssistantName] = newThread.id;
        console.log(`Created new thread for Sub-assistant ${subAssistantName}: ${newThread.id}`);
        return newThread.id;
    }

    async addFilesToConversation(threadId, filePaths) {
        try {
            this.setCurrentThreadId(threadId);
            const vectorStoreName = `ConversationStore_${threadId}`;
            const uploadedFiles = await Promise.all(filePaths.map(filePath => this.uploadAndProcessFile(filePath)));
            
            const vectorStoreId = await this.uploadFilesAndCreateVectorStore(vectorStoreName, uploadedFiles);
            
            // Store the vector store ID for this thread
            this.threadVectorStores[threadId] = vectorStoreId;
    
            // Return the uploaded files with their vector store ID
            return uploadedFiles.map(file => ({ 
                id: file.id, 
                name: file.name, 
                vectorStoreId: vectorStoreId 
            }));
        } catch (error) {
            console.error(`Error adding files to conversation: ${error.message}`);
            throw error;
        } finally {
            this.clearCurrentThreadId();
        }
    }

    async deleteFileFromConversation(threadId, fileId) {
        try {
            this.setCurrentThreadId(threadId);
            const vectorStoreId = this.threadVectorStores[threadId];
            if (!vectorStoreId) {
                throw new Error('No vector store found for this thread');
            }

            await this.client.beta.vectorStores.files.del(vectorStoreId, fileId);
            await this.client.files.del(fileId);

            console.log(`File ${fileId} deleted from vector store ${vectorStoreId} and OpenAI`);
            return { message: 'File deleted successfully' };
        } catch (error) {
            console.error(`Error deleting file from conversation: ${error.message}`);
            throw error;
        } finally {
            this.clearCurrentThreadId();
        }
    }

    async endConversation(threadId) {
        try {
            this.setCurrentThreadId(threadId);
            await this.client.beta.threads.del(threadId);
            delete this.threadVectorStores[threadId];
            console.log(`Thread ${threadId} and associated resources deleted`);
            return { message: 'Conversation ended successfully' };
        } catch (error) {
            console.error(`Error ending conversation: ${error.message}`);
            throw error;
        } finally {
            this.clearCurrentThreadId();
        }
    }
}

module.exports = Chat;