const BaseAssistantService = require('./BaseAssistantService');
const CompanyProfileAssistant = require('./CompanyProfileAssistant');
const FinancialAnalysisAssistant = require('./FinancialAnalysisAssistant');
const TechnicalAnalysisAssistant = require('./TechnicalAnalysisAssistant');
const EconomicDataAssistant = require('./EconomicDataAssistant');
const SentimentAnalysisAssistant = require('./SentimentAnalysisAssistant');
const path = require('path');
const fs = require('fs');
const os = require('os');

class MainAssistantService extends BaseAssistantService {
    constructor(apiKey) {
        super(apiKey);
        this.assistantName = 'MainAssistant';
        this.subAssistants = {};
        this.subAssistantThreads = {};
        this.instructions = this.getInstructions();
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
            this.addSystemLog(`Sub-assistant ${name} initialized`);
        } catch (error) {
            this.addSystemLog(`Error initializing ${name} Assistant: ${error.message}`);
            throw error;
        }
    }

    async chatWithAssistant(thread_id, assistant_id, userMessage) {
        try {
            const baseResponse = await super.chatWithAssistant(thread_id, assistant_id, userMessage);
            if (baseResponse) {
                const processedResponse = await this.processCodeInterpreterOutput(baseResponse);
                if (this.responseRequiresSubAssistant(processedResponse)) {
                    const enhancedResponse = await this.enhanceResponseWithSubAssistantInfo(processedResponse, thread_id);
                    return enhancedResponse;
                }
                return processedResponse;
            }
            return baseResponse;
        } catch (error) {
            this.addSystemLog(`Error in chatWithAssistant: ${error.message}`);
            throw error;
        }
    }

    async uploadFilesAndCreateVectorStore(name, filePaths) {
        this.addSystemLog(`Uploading files and creating vector store: ${name}`);
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
            this.addSystemLog(`Vector store created and attached: ${vectorStore.id}`);
            return vectorStore.id;
        } catch (error) {
            this.addSystemLog(`Error uploading files and creating vector store: ${error.message}`);
            throw error;
        }
    }

    responseRequiresSubAssistant(response) {
        const subAssistantKeywords = ['company profile', 'financial analysis', 'technical analysis', 'economic data', 'sentiment analysis'];
        if (typeof response === 'string') {
            return subAssistantKeywords.some(keyword => response.toLowerCase().includes(keyword));
        } else if (response && response.content) {
            return response.content.some(content => {
                if (content.type === 'text') {
                    const text = content.text.value || content.text;
                    return typeof text === 'string' && subAssistantKeywords.some(keyword => text.toLowerCase().includes(keyword));
                }
                return false;
            });
        }
        return false;
    }

    async enhanceResponseWithSubAssistantInfo(baseResponse, thread_id) {
        let enhancedResponse = baseResponse;
        const subAssistantsToCall = this.determineRequiredSubAssistants(baseResponse);
        for (const subAssistant of subAssistantsToCall) {
            const subAssistantResponse = await this.messageSubAssistant(subAssistant, baseResponse);
            enhancedResponse = this.incorporateSubAssistantResponse(enhancedResponse, subAssistantResponse, subAssistant);
        }
        await this.createMessage(thread_id, {
            role: 'assistant',
            content: enhancedResponse,
        });
        return enhancedResponse;
    }

    determineRequiredSubAssistants(response) {
        const subAssistants = [];
        if (response.toLowerCase().includes('company profile')) subAssistants.push('CompanyProfile');
        if (response.toLowerCase().includes('financial analysis')) subAssistants.push('FinancialAnalysis');
        if (response.toLowerCase().includes('technical analysis')) subAssistants.push('TechnicalAnalysis');
        if (response.toLowerCase().includes('economic data') || 
            response.toLowerCase().includes('economic indicators') || 
            response.toLowerCase().includes('treasury rates') ||
            response.toLowerCase().includes('market risk premium')) {
            subAssistants.push('EconomicData');
        }
        if (response.toLowerCase().includes('sentiment') || 
            response.toLowerCase().includes('social media') ||
            response.toLowerCase().includes('public opinion')) {
            subAssistants.push('SentimentAnalysis');
        }
        return subAssistants;
    }

    incorporateSubAssistantResponse(mainResponse, subResponse, subAssistantName) {
        return `${mainResponse}\n\nAdditional information from ${subAssistantName}:\n${subResponse}`;
    }

    async handleRequiresAction(thread_id, run) {
        this.addSystemLog('Handling required action in MainAssistantService...');
        if (run.required_action && run.required_action.submit_tool_outputs) {
            const toolOutputs = await this.executeToolCalls(run.required_action.submit_tool_outputs.tool_calls);
            return await this.submitToolOutputs(thread_id, run.id, toolOutputs);
        }
        return run;
    }

    async executeToolCalls(toolCalls) {
        return await Promise.all(toolCalls.map(async (tool) => {
            const result = await this.executeToolCall(tool);
            return this.createToolOutput(tool.id, result);
        }));
    }

    async executeToolCall(toolCall) {
        const { id, function: { name, arguments: args } } = toolCall;
        const parsedArgs = JSON.parse(args);
        this.addSystemLog(`Executing tool call: ${name} with arguments: ${JSON.stringify(parsedArgs)}`);

        switch (name) {
            case 'messageSubAssistant':
                const response = await this.messageSubAssistant(parsedArgs.subAssistantName, parsedArgs.message);
                this.addSystemLog(`Tool call response: ${JSON.stringify(response)}`);
                return response;
            case 'uploadFile':
                try {
                    const { fileName, content } = parsedArgs;
                    const filePath = path.join(os.tmpdir(), fileName);
                    fs.writeFileSync(filePath, content);
                    const uploadedFile = await this.uploadAndProcessFile(filePath);
                    if (this.currentThreadId) {
                        const vectorStoreName = `ThreadStore_${this.currentThreadId}`;
                        await this.uploadFilesAndCreateVectorStore(vectorStoreName, [filePath]);
                    } else {
                        this.addSystemLog('Warning: No current thread ID available. File uploaded but not added to vector store.');
                    }
                    fs.unlinkSync(filePath); // Clean up the temporary file
                    return `File ${fileName} uploaded successfully`;
                } catch (error) {
                    this.addSystemLog(`Error uploading file: ${error.message}`);
                    return `Error uploading file: ${error.message}`;
                }
            default:
                throw new Error(`Unknown function ${name}`);
        }
    }

    createToolOutput(tool_call_id, result) {
        return {
            tool_call_id,
            output: JSON.stringify(result),
        };
    }

    async submitToolOutputs(thread_id, run_id, toolOutputs) {
        try {
            await this.client.beta.threads.runs.submitToolOutputs(
                thread_id,
                run_id,
                { tool_outputs: toolOutputs },
            );
            this.addSystemLog("Tool outputs submitted successfully.");
            return await this.client.beta.threads.runs.retrieve(thread_id, run_id);
        } catch (error) {
            this.addSystemLog(`Error submitting tool outputs: ${error.message}`);
            throw error;
        }
    }

    async messageSubAssistant(subAssistantName, message) {
        this.addSystemLog(`Messaging Sub-assistant: ${subAssistantName}`);
        const subAssistant = this.subAssistants[subAssistantName];
        if (!subAssistant) {
            throw new Error(`Sub-assistant ${subAssistantName} not found`);
        }
        let threadId = this.subAssistantThreads[subAssistantName];
        if (!threadId) {
            threadId = await this.createNewThread(subAssistantName);
        }
        const formattedMessage = this.formatMessage(message, subAssistant);
        try {
            const response = await subAssistant.processMessage(formattedMessage, threadId);
            this.addSystemLog(`Received response from Sub-assistant ${subAssistantName}: ${JSON.stringify(response)}`);
            return response;
        } catch (error) {
            this.addSystemLog(`Error processing message with sub-assistant ${subAssistantName}: ${error.message}`);
            return `Error: Unable to process message. ${error.message}`;
        }
    }

    async createNewThread(subAssistantName) {
        const newThread = await this.createThread({ metadata: { subAssistant: subAssistantName } });
        this.subAssistantThreads[subAssistantName] = newThread.id;
        this.addSystemLog(`Created new thread for Sub-assistant ${subAssistantName}: ${newThread.id}`);
        return newThread.id;
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

    async processMessage(message, threadId) {
        this.addSystemLog(`Processing message in MainAssistantService: ${message.content}`);
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
            this.addSystemLog(`Error processing message in MainAssistantService: ${error.message}`);
            return `I apologize, but I encountered an error while processing your request. ${error.message}`;
        }
    }

    async addFilesToConversation(filePaths) {
        try {
            const vectorStoreName = `ConversationStore_${this.currentThreadId}`;
            const vectorStoreId = await this.uploadFilesAndCreateVectorStore(vectorStoreName, filePaths);
            
            if (this.currentThreadId) {
                await this.modifyThread(this.currentThreadId, {
                    tool_resources: {
                        file_search: {
                            vector_store_ids: [vectorStoreId]
                        }
                    }
                });
                this.addSystemLog(`Vector store ${vectorStoreId} attached to thread ${this.currentThreadId}`);
            } else {
                this.addSystemLog('Warning: No current thread ID available. Vector store created but not attached to any thread.');
            }

            const uploadedFiles = await Promise.all(filePaths.map(filePath => this.uploadAndProcessFile(filePath)));
            return uploadedFiles.map(file => ({ id: file.id, name: file.name }));
        } catch (error) {
            this.addSystemLog(`Error adding files to conversation: ${error.message}`);
            throw error;
        }
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
            this.addSystemLog('Run failed:', run.last_error);
            return `I apologize, but I encountered an error while processing your request. ${run.last_error.message}`;
        }

        const messages = await this.client.beta.threads.messages.list(threadId);
        const assistantResponse = messages.data.find(m => m.role === 'assistant');
        if (assistantResponse && assistantResponse.content[0].text) {
            return assistantResponse.content[0].text.value;
        }

        return 'I apologize, but I couldn\'t generate a response.';
    }
}

module.exports = MainAssistantService;