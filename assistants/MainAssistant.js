const BaseAssistantService = require('./BaseAssistantService');
const CompanyProfileAssistant = require('./CompanyProfileAssistant');
const FinancialAnalysisAssistant = require('./FinancialAnalysisAssistant');
const TechnicalAnalysisAssistant = require('./TechnicalAnalysisAssistant');
const EconomicDataAssistant = require('./EconomicDataAssistant');
const SentimentAnalysisAssistant = require('./SentimentAnalysisAssistant');
const OpenAI = require('openai');
const ToolExecutor = require('../services/ToolExecutor');
const FileService = require('../services/File');
const Thread = require('../models/Thread');
const User = require('../models/User');
const Assistant = require('../models/Assistant');

class MainAssistant extends BaseAssistantService {
    constructor(apiKey) {
        super(apiKey);
        this.assistantName = 'MainAssistant';
        this.subAssistants = {};
        this.subAssistantThreads = {};
        this.threadVectorStores = {};
        this.instructions = this.getInstructions();
        this.client = new OpenAI({ apiKey });
        this.fileService = new FileService(apiKey);
        this.toolExecutor = new ToolExecutor(this);
        this.currentThreadId = null;
    }

    getInstructions() {
        return `You are the main stock and financial analyst. Your role is to analyze stock data and provide insightful reports.
        You have access to various financial data and metrics for stocks. When asked about a specific stock,
        you should retrieve the necessary data, process it, and provide a comprehensive analysis.
        Your analysis should include:
        1. Basic stock information (price, volume, market cap)
        2. Fundamental Analysis
        3. Technical indicators (moving averages, RSI, MACD)
        4. Financial ratios and metrics
        5. Potential risks and opportunities
        6. Economic data analysis and how it will affect the given stock
        7. Sentiment analysis based on social media and other sources
        8. A summary and recommendation (buy, sell or hold). Include a recommended entry price.
        
        When you need specific information, use the messageSubAssistant function to request it from the appropriate sub-assistant.
        When you need to perform complex calculations or data analysis, use the Code Interpreter to write and run Python code.
        Always provide clear explanations and justify your analysis.
        Be conversational and engaging in your responses. Remember the context of the ongoing conversation.`;
    }

    async initialize({ model, name }) {
        this.addSystemLog('Initializing Main Assistant');
        await this.deleteExistingAssistants();
        await this.initializeMainAssistant(model, name);
        await this.initializeSubAssistants(model);
    }

    async deleteExistingAssistants() {
        this.addSystemLog('Checking for existing assistants');
        try {
            const existingAssistants = await this.listAssistants();
            if (existingAssistants.length > 0) {
                this.addSystemLog('Existing assistants found, deleting them');
                for (const assistant of existingAssistants) {
                    try {
                        await this.deleteAssistant(assistant.id);
                        this.addSystemLog(`Deleted assistant: ${assistant.id}`);
                    } catch (error) {
                        this.addSystemLog(`Failed to delete assistant ${assistant.id}: ${error.message}`);
                    }
                }
                this.addSystemLog('Finished deleting existing assistants');
            } else {
                this.addSystemLog('No existing assistants found, continuing');
            }
        } catch (error) {
            this.addSystemLog(`Error listing assistants: ${error.message}`);
        }
    }

    async initializeMainAssistant(model, name) {
        const messageSubAssistantTool = this.getMessageSubAssistantTool();
        const uploadFileTool = this.getUploadFileTool();
        const newAssistant = await this.createAssistant({
            model,
            name,
            instructions: this.instructions,
            tools: [
                messageSubAssistantTool,
                uploadFileTool,
                { type: "code_interpreter" },
                { type: "file_search" }
            ]
        });
        this.assistantId = newAssistant.id;
        this.assistantName = name;
        await this.saveAssistantId('MAIN', this.assistantId, model);
        this.addSystemLog('Main Assistant initialized with Code Interpreter and File Search');
    }

    getMessageSubAssistantTool() {
        return {
            type: "function",
            function: {
                name: "messageSubAssistant",
                description: "Send a message to a specific sub-assistant.",
                parameters: {
                    type: "object",
                    properties: {
                        subAssistantName: {
                            type: "string",
                            description: "The name of the sub-assistant to message",
                            enum: ["CompanyProfile", "FinancialAnalysis", "TechnicalAnalysis", "EconomicData", "SentimentAnalysis"]
                        },
                        message: {
                            type: "string",
                            description: "The message to send to the sub-assistant"
                        }
                    },
                    required: ["subAssistantName", "message"]
                }
            }
        };
    }

    getUploadFileTool() {
        return {
            type: "function",
            function: {
                name: "uploadFile",
                description: "Upload a file to the conversation.",
                parameters: {
                    type: "object",
                    properties: {
                        fileName: {
                            type: "string",
                            description: "The name of the file to be created"
                        },
                        content: {
                            type: "string",
                            description: "The content of the file"
                        }
                    },
                    required: ["fileName", "content"]
                }
            }
        };
    }

    async initializeSubAssistants(model) {
        this.addSystemLog('Initializing Sub-assistants');
        const subAssistantConfigs = [
            { name: 'CompanyProfile', AssistantClass: CompanyProfileAssistant },
            { name: 'FinancialAnalysis', AssistantClass: FinancialAnalysisAssistant },
            { name: 'TechnicalAnalysis', AssistantClass: TechnicalAnalysisAssistant },
            { name: 'EconomicData', AssistantClass: EconomicDataAssistant },
            { name: 'SentimentAnalysis', AssistantClass: SentimentAnalysisAssistant }
        ];

        for (const config of subAssistantConfigs) {
            await this.initializeSubAssistant(config.name, config.AssistantClass, model);
        }

        this.addSystemLog('All sub-assistants initialized');
    }

    async initializeSubAssistant(name, AssistantClass, model) {
        this.addSystemLog(`Initializing ${name} Assistant`);
        try {
            const assistant = new AssistantClass(this.apiKey);
            await assistant.initialize({ model, name });
            this.subAssistants[name] = assistant;
            
            // Save the sub-assistant ID
            await this.saveAssistantId(name, assistant.assistantId, model);
            
            this.addSystemLog(`Sub-assistant ${name} initialized and saved with ID: ${assistant.assistantId}`);
        } catch (error) {
            this.addSystemLog(`Error initializing ${name} Assistant: ${error.message}`);
            throw error;
        }
    }

    async deleteAllAssistants() {
        this.addSystemLog('Deleting Main assistant');
        await this.deleteAssistant(this.assistantId);
        this.assistantId = null;

        this.addSystemLog('Deleting sub-assistants...');
        await Promise.all(Object.entries(this.subAssistants).map(([name, assistant]) => this.deleteAssistant(assistant.assistantId, name)));
        this.addSystemLog('All assistants deleted');

        await this.deleteAllVectorStores();
    }

    getAndClearSystemLogs() {
        const logs = this.getSystemLogs();
        this.clearSystemLogs();
        return logs;
    } 

    setCurrentThreadId(threadId) {
        this.currentThreadId = threadId;
    }

    clearCurrentThreadId() {
        this.currentThreadId = null;
    }

    async createThread(options = {}) {
        const { userId, subAssistantName = null, metadata = {} } = options;
        
        try {
            let assistantToUse;
            
            if (subAssistantName) {
                assistantToUse = await Assistant.findOne({ name: subAssistantName });
                if (!assistantToUse) {
                    throw new Error(`Sub-assistant ${subAssistantName} not found in database`);
                }
            } else {
                assistantToUse = await Assistant.findOne({ name: 'MAIN' });
                if (!assistantToUse) {
                    throw new Error('Main assistant not found in database');
                }
            }

            const threadMetadata = {
                ...metadata,
                assistantName: subAssistantName || 'MAIN'
            };

            const thread = await this.client.beta.threads.create({ metadata: threadMetadata });
            this.setCurrentThreadId(thread.id);

            if (userId) {
                const newThread = await Thread.create({
                    threadId: thread.id,
                    user: userId, // This should now correctly be just the userId
                    messages: [],
                    // We don't need to store metadata in the Thread model as it's not in the schema
                });

                // Update User document with the new thread reference
                await User.findByIdAndUpdate(userId, {
                    $push: { threads: newThread._id }
                });
            }

            if (subAssistantName) {
                this.subAssistantThreads[subAssistantName] = thread.id;
            }

            console.log(`Thread created: ${thread.id} for ${subAssistantName || 'MAIN'} assistant`);
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
    
            // Use the createMessage method from BaseAssistantService
            await this.createMessage(threadId, {
                role: 'user',
                content: userMessage
            });
    
            const stream = await this.client.beta.threads.runs.createAndStream(
                threadId,
                { assistant_id: mainAssistant.assistantId }
            );
    
            let assistantResponse = '';
            await this.observeStream(stream, (event) => {
                if (event.type === 'textDelta') {
                    assistantResponse += event.data.value;
                }
                onEvent(event);
            });

            // Save both user message and assistant response
            await this.saveMessages(threadId, userMessage, assistantResponse);

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

            let assistantResponse = '';
            await this.observeStream(stream, (event) => {
                if (event.type === 'textDelta') {
                    assistantResponse += event.data.value;
                }
                onEvent(event);
            });

            // Save the assistant's response after tool calls
            await this.saveMessages(threadId, null, assistantResponse);

        } catch (error) {
            console.error('[handleToolCalls] Error handling tool calls:', error);
            onEvent({ type: 'error', data: error.message });
        }
    }

    async saveMessages(threadId, userMessage, assistantResponse) {
        try {
            const thread = await Thread.findOne({ threadId: threadId });
            if (!thread) {
                throw new Error(`Thread not found: ${threadId}`);
            }

            const messagesToSave = [];

            if (userMessage) {
                messagesToSave.push({ role: 'user', content: userMessage });
            }

            if (assistantResponse) {
                messagesToSave.push({ role: 'assistant', content: assistantResponse });
            }

            thread.messages.push(...messagesToSave);
            await thread.save();

            console.log(`[saveMessages] Saved ${messagesToSave.length} messages for thread ${threadId}`);
        } catch (error) {
            console.error(`[saveMessages] Error saving messages: ${error.message}`);
            throw error;
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

    async uploadAndProcessFile(filePath) {
        try {
            const file = await this.client.files.create({
                file: fs.createReadStream(filePath),
                purpose: 'assistants',
            });
            console.log(`File uploaded successfully: ${file.id}`);
            return file;
        } catch (error) {
            console.error(`Error uploading file: ${error.message}`);
            throw error;
        }
    }

    async uploadFilesAndCreateVectorStore(name, files) {
        try {
            return await this.fileService.uploadFilesAndCreateVectorStore(name, files);
        } catch (error) {
            console.error(`Error creating vector store and uploading files: ${error.message}`);
            throw error;
        }
    }

    async deleteAllVectorStores() {
        this.addSystemLog('Deleting all vector stores...');
        try {
            // Assuming you're using OpenAI's vector store functionality
            const vectorStores = await this.client.beta.vectorStores.list();
            for (const store of vectorStores.data) {
                await this.client.beta.vectorStores.del(store.id);
                this.addSystemLog(`Deleted vector store: ${store.id}`);
            }
            this.addSystemLog('All vector stores deleted successfully');
        } catch (error) {
            this.addSystemLog(`Error deleting vector stores: ${error.message}`);
            throw error;
        }
    }

    getAssistantClass(name) {
        switch (name) {
            case 'CompanyProfile':
                return CompanyProfileAssistant;
            case 'FinancialAnalysis':
                return FinancialAnalysisAssistant;
            case 'TechnicalAnalysis':
                return TechnicalAnalysisAssistant;
            case 'EconomicData':
                return EconomicDataAssistant;
            case 'SentimentAnalysis':
                return SentimentAnalysisAssistant;
            default:
                throw new Error(`Unknown sub-assistant type: ${name}`);
        }
    }

    formatMessage(message, subAssistant) {
        return {
            sender: {
                id: this.assistantId,
                name: this.assistantName
            },
            receiver: {
                id: subAssistant.assistantId,
                name: subAssistant.assistantName
            },
            content: message
        };
    }
}

module.exports = MainAssistant;