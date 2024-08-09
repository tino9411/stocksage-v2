const Assistant = require('../models/Assistant');
const User = require('../models/User');
const Thread = require('../models/Thread');
const OpenAI = require('openai');
const EventEmitter = require('events');
const ToolExecutor = require('./toolExecutor');
const FileService = require('./File');  // Import the new FileService

class Chat extends EventEmitter {
    constructor(apiKey) {
        super();
        this.client = new OpenAI({ apiKey });
        this.fileService = new FileService(apiKey);  // Initialize the FileService
        this.toolExecutor = new ToolExecutor(this);
        this.assistantId = null;
        this.assistantName = null;
        this.subAssistants = {};
        this.subAssistantThreads = {};
        this.currentThreadId = null;
    }

    setCurrentThreadId(threadId) {
        this.currentThreadId = threadId;
    }

    clearCurrentThreadId() {
        this.currentThreadId = null;
    }

    async createThread(userId) {
        try {
            const mainAssistant = await Assistant.findOne({ name: 'MAIN' });
            if (!mainAssistant) {
                throw new Error('Main assistant not found in database');
            }

            const thread = await this.client.beta.threads.create();
            this.setCurrentThreadId(thread.id);

            // Create a new Thread document in the database
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

            // Update the Thread document in the database
            await Thread.findOneAndUpdate(
                { threadId: threadId },
                { 
                    $push: { 
                        messages: [
                            { role: 'user', content: userMessage },
                            ...finalMessages.map(msg => ({ role: msg.role, content: msg.content[0].text.value }))
                        ] 
                    },
                    updatedAt: new Date()
                }
            );
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

    async addFilesToConversation(threadId, files) {
        try {
            this.setCurrentThreadId(threadId);
            console.log(`[addToConversation] Starting to upload files for thread: ${threadId}`);
    
            // Use the FileService to handle file uploads and vector store creation
            const uploadedFiles = await this.fileService.addFilesToConversation(threadId, files);
    
            console.log(`[addToConversation] Files successfully added to conversation for thread ${threadId}`);
            return uploadedFiles;
        } catch (error) {
            console.error(`[addToConversation] Error adding files to conversation: ${error.message}`);
            throw error;
        } finally {
            this.clearCurrentThreadId();
        }
    }

    async deleteFileFromConversation(threadId, fileId) {
        try {
            this.setCurrentThreadId(threadId);
            
            // Use the FileService to handle file deletion
            const result = await this.fileService.deleteFileFromConversation(threadId, fileId);
            console.log(result.message);
        } catch (error) {
            console.error(`[deleteFileFromConversation] Error deleting file: ${error.message}`);
            throw error;
        } finally {
            this.clearCurrentThreadId();
        }
    }

    async endConversation(threadId, userId) {
        const maxRetries = 3;
        let retries = 0;
    
        while (retries < maxRetries) {
            try {
                // Find the Thread document to get its ObjectId
                const thread = await Thread.findOne({ threadId: threadId });
                if (!thread) {
                    console.log(`No thread found with threadId ${threadId} in the database`);
                    return { success: false, message: 'Thread not found in the database' };
                }
    
                const threadObjectId = thread._id;
    
                // Remove the thread reference from the User document
                console.log(`Removing thread ${threadObjectId} reference from user ${userId}`);
                const updateResult = await User.findByIdAndUpdate(userId, {
                    $pull: { threads: threadObjectId }
                });
    
                if (!updateResult) {
                    console.log(`Failed to update user ${userId}. User might not exist.`);
                    return { success: false, message: 'Failed to update user' };
                }
    
                // Delete files and vector stores
                await this.fileService.endConversation(threadId);
    
                // Delete from OpenAI servers
                try {
                    await this.client.beta.threads.del(threadId);
                    console.log(`Thread ${threadId} deleted from OpenAI server`);
                } catch (openAIError) {
                    console.error(`Error deleting thread from OpenAI: ${openAIError.message}`);
                    // Continue with local deletion even if OpenAI deletion fails
                }
    
                // Delete the thread from the database
                console.log(`Deleting thread ${threadId} from the database`);
                await Thread.deleteOne({ _id: threadObjectId });
    
                // Verify deletion
                const verifyDeletion = await Thread.findOne({ threadId: threadId });
                if (!verifyDeletion) {
                    console.log(`Thread ${threadId} successfully deleted from the database and removed from user's threads`);
                    return { success: true, message: 'Thread deleted successfully and removed from user\'s threads' };
                } else {
                    console.log(`Thread ${threadId} not deleted from the database. Retrying...`);
                    retries++;
                }
            } catch (error) {
                console.error(`Error ending conversation for thread ${threadId}: ${error.message}`);
                retries++;
                if (retries >= maxRetries) {
                    throw error;
                }
            }
        }
    
        return { success: false, message: 'Failed to delete thread after multiple attempts' };
    }
}
module.exports = Chat;