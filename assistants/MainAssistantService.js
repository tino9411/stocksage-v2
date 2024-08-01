// Importing the base service and sub-assistant classes
const BaseAssistantService = require('./BaseAssistantService');
const CompanyProfileAssistant = require('./CompanyProfileAssistant');
const FinancialAnalysisAssistant = require('./FinancialAnalysisAssistant');
const TechnicalAnalysisAssistant = require('./TechnicalAnalysisAssistant');
const EconomicDataAssistant = require('./EconomicDataAssistant');
const SentimentAnalysisAssistant = require('./SentimentAnalysisAssistant');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const os = require('os');



class MainAssistantService extends BaseAssistantService {
    constructor(apiKey) {
        super(apiKey);
        this.assistantId = null;
        this.assistantName = 'MainAssistant';
        this.subAssistants = {};
        this.subAssistantThreads = {};
        this.vectorStores = {};
        this.instructions = this.getInstructions();
        this.threadVectorStores = {}; // Add this line to keep track of vector stores per thread
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


    // Method to initialize the main assistant and its sub-assistants
    async initialize({ model, name }) {
        this.logSystemEvent('Initializing Main Assistant');
        await this.deleteExistingAssistants();
        await this.initializeMainAssistant(model, name);
        await this.initializeSubAssistants(model);
    }

    async deleteExistingAssistants() {
        this.logSystemEvent('Checking for existing assistants');
        try {
            const existingAssistants = await this.listAssistants();
            if (existingAssistants.length > 0) {
                this.logSystemEvent('Existing assistants found, deleting them');
                for (const assistant of existingAssistants) {
                    try {
                        await this.deleteAssistant(assistant.id);
                        this.logSystemEvent(`Deleted assistant: ${assistant.id}`);
                    } catch (error) {
                        this.logSystemEvent(`Failed to delete assistant ${assistant.id}: ${error.message}`);
                    }
                }
                this.logSystemEvent('Finished deleting existing assistants');
            } else {
                this.logSystemEvent('No existing assistants found, continuing');
            }
        } catch (error) {
            this.logSystemEvent(`Error listing assistants: ${error.message}`);
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
                { type: "file_search" }  // Add this line
            ]
        });
        this.assistantId = newAssistant.id;
        this.logSystemEvent('Main Assistant initialized with Code Interpreter and File Search');
    }

    // Method to get the tool for messaging sub-assistants
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
        this.logSystemEvent('Initializing Sub-assistants');
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

        this.logSystemEvent('All sub-assistants initialized');
    }

    async initializeSubAssistant(name, AssistantClass, model) {
        this.logSystemEvent(`Initializing ${name} Assistant`);
        try {
            let assistant;
            if (typeof AssistantClass === 'function') {
                // If AssistantClass is a constructor
                assistant = new AssistantClass(this.apiKey);
            } else if (typeof AssistantClass === 'object' && AssistantClass !== null) {
                // If AssistantClass is an object (e.g., exported as a singleton)
                assistant = AssistantClass;
            } else {
                throw new Error(`Invalid AssistantClass type for ${name}`);
            }

            if (typeof assistant.initialize === 'function') {
                await assistant.initialize({ model, name });
            } else {
                this.logSystemEvent(`Warning: ${name} Assistant does not have an initialize method`);
            }

            this.subAssistants[name] = assistant;
            this.logSystemEvent(`Sub-assistant ${name} initialized`);
        } catch (error) {
            this.logSystemEvent(`Error initializing ${name} Assistant: ${error.message}`);
            throw error;
        }
    }

    async chatWithAssistant(thread_id, assistant_id, userMessage, stream = false) {
        try {
            const baseResponse = await super.chatWithAssistant(thread_id, assistant_id, userMessage, stream);
    
            if (stream) {
                return baseResponse;
            }
    
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
            this.logSystemEvent(`Error in chatWithAssistant: ${error.message}`);
            throw error;
        }
    }

    async createVectorStore(name, files) {
        try {
          this.logSystemEvent(`Creating vector store with files: ${JSON.stringify(files.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType })))}`);
          const vectorStore = await this.client.beta.vectorStores.create({
            name: name,
            file_ids: files.map(file => file.id)
          });
          this.vectorStores[name] = vectorStore.id;
          this.logSystemEvent(`Vector store created: ${vectorStore.id}`);
          return vectorStore.id;
        } catch (error) {
          this.logSystemEvent(`Error creating vector store: ${error.message}`);
          throw error;
        }
      }
      
      async uploadFile(filePath) {
        const fileName = path.basename(filePath);
        const fileStream = fs.createReadStream(filePath);
        const mimeType = mime.lookup(filePath) || 'application/octet-stream';
      
        this.logSystemEvent(`Uploading file: ${fileName} (MIME: ${mimeType})`);
      
        const file = await this.client.files.create({
          file: fileStream,
          purpose: 'assistants',
        });
      
        this.logSystemEvent(`File uploaded: ${file.id} (${fileName}, MIME: ${mimeType})`);
        return { id: file.id, name: fileName, mimeType };
      }

      async attachVectorStoreToAssistant(vectorStoreId) {
        try {
          await this.client.beta.assistants.update(this.assistantId, {
            tool_resources: { 
              file_search: { 
                vector_store_ids: [vectorStoreId] 
              } 
            }
          });
          this.logSystemEvent(`Vector store ${vectorStoreId} attached to assistant ${this.assistantId}`);
        } catch (error) {
          this.logSystemEvent(`Error attaching vector store to assistant: ${error.message}`);
          throw error;
        }
      }

      async addFilesToVectorStore(threadId, files) {
        if (!threadId) {
            throw new Error('Thread ID is required to add files to vector store');
        }

        let vectorStoreId = this.threadVectorStores[threadId];
        const vectorStoreName = `ConversationStore_${threadId}`;

        if (!vectorStoreId) {
            // Create a new vector store if one doesn't exist for this thread
            vectorStoreId = await this.createVectorStore(vectorStoreName, files);
            this.threadVectorStores[threadId] = vectorStoreId;
        } else {
            // Add files to the existing vector store
            for (const file of files) {
                await this.client.beta.vectorStores.files.create(vectorStoreId, { file_id: file.id });
            }
        }

        // Update the assistant with the vector store
        await this.attachVectorStoreToAssistant(vectorStoreId);

        // Update the thread with the vector store
        await this.client.beta.threads.update(threadId, {
            tool_resources: {
                file_search: {
                    vector_store_ids: [vectorStoreId]
                }
            }
        });

        return vectorStoreId;
    }

    async addFilesToConversation(filePaths) {
        try {
          const files = await Promise.all(filePaths.map(filePath => this.uploadFile(filePath)));
          const vectorStoreName = `ConversationStore_${this.threadId}`;
          const vectorStoreId = await this.createVectorStore(vectorStoreName, files);
          await this.attachVectorStoreToAssistant(vectorStoreId);
          return files.map(file => ({ id: file.id, name: file.name }));
        } catch (error) {
          console.error('Error adding files to conversation:', error);
          if (error.response && error.response.data) {
            console.error('API Error Details:', error.response.data);
          }
          throw error;
        }
      }
    
    async createVectorStoreForConversation(name, fileIds, threadId) {
        const vectorStoreId = await this.createVectorStore(name, fileIds);
        await this.client.beta.threads.update(threadId, {
            tool_resources: {
                file_search: {
                    vector_store_ids: [vectorStoreId]
                }
            }
        });
        this.logSystemEvent(`Vector store ${vectorStoreId} created and attached to thread ${threadId}`);
        return vectorStoreId;
    }

    responseRequiresSubAssistant(response) {
        const subAssistantKeywords = ['company profile', 'financial analysis', 'technical analysis'];
        
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

    async processCodeInterpreterOutput(message) {
        this.logSystemEvent(`Processing Code Interpreter output: ${JSON.stringify(message)}`);
        
        if (typeof message === 'string') {
            this.logSystemEvent('Message is a string, returning as-is');
            return message;
        }
    
        if (!message || !message.content) {
            this.logSystemEvent('Message is empty or has no content, returning as-is');
            return message;
        }
    
        const contents = Array.isArray(message.content) ? message.content : [message.content];
    
        for (const content of contents) {
            if (content.type === 'image_file') {
                this.logSystemEvent(`Processing image file: ${JSON.stringify(content.image_file)}`);
                const fileId = content.image_file.file_id;
                const imageUrl = await this.downloadAndSaveFile(fileId, 'image');
                if (imageUrl) {
                    content.image_file.url = imageUrl;
                    this.logSystemEvent(`Image URL set to: ${imageUrl}`);
                }
            } else if (content.type === 'text') {
                const text = content.text.value || content.text;
                if (text && typeof text === 'object' && text.annotations) {
                    for (const annotation of text.annotations) {
                        if (annotation.type === 'file_path') {
                            this.logSystemEvent(`Processing file path annotation: ${JSON.stringify(annotation)}`);
                            const fileId = annotation.file_path.file_id;
                            const fileUrl = await this.downloadAndSaveFile(fileId, 'data');
                            if (fileUrl) {
                                text.value = text.value.replace(
                                    annotation.text,
                                    `[${annotation.text}](${fileUrl})`
                                );
                                this.logSystemEvent(`File URL set to: ${fileUrl}`);
                            }
                        }
                    }
                }
            }
        }
    
        return message;
    }

    async downloadAndSaveFile(fileId, type) {
        try {
            console.log(`Attempting to download file: ${fileId}`);
            const response = await this.client.files.content(fileId);
            console.log(`File content retrieved for: ${fileId}`);
            
            const buffer = Buffer.from(await response.arrayBuffer());
            const fileName = `${type}_${fileId}.${type === 'image' ? 'png' : 'csv'}`;
            
            const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
            console.log(`Uploads directory: ${uploadsDir}`);
            
            if (!fs.existsSync(uploadsDir)) {
                console.log(`Creating uploads directory: ${uploadsDir}`);
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            
            const filePath = path.join(uploadsDir, fileName);
            console.log(`Saving file to: ${filePath}`);
            
            fs.writeFileSync(filePath, buffer);
            console.log(`File saved successfully: ${filePath}`);
            
            return `/api/files/${fileName}`;
        } catch (error) {
            console.error(`Error downloading file ${fileId}:`, error);
            return null;
        }
    }


    async enhanceResponseWithSubAssistantInfo(baseResponse, thread_id) {
        let enhancedResponse = baseResponse;

        // Determine which sub-assistant(s) to call based on the content of the response
        const subAssistantsToCall = this.determineRequiredSubAssistants(baseResponse);

        for (const subAssistant of subAssistantsToCall) {
            const subAssistantResponse = await this.messageSubAssistant(subAssistant, baseResponse);
            enhancedResponse = this.incorporateSubAssistantResponse(enhancedResponse, subAssistantResponse, subAssistant);
        }

        // Create a new message in the thread with the enhanced response
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
        this.logSystemEvent('Handling required action in MainAssistantService...');
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
        this.logSystemEvent(`Executing tool call: ${name} with arguments: ${JSON.stringify(parsedArgs)}`);

        switch (name) {
            case 'messageSubAssistant':
                    const response = await this.messageSubAssistant(parsedArgs.subAssistantName, parsedArgs.message);
                    this.logSystemEvent(`Tool call response: ${JSON.stringify(response)}`);
                    return response;
            case 'uploadFile':
                try {
                    const { fileName, content } = parsedArgs;
                    const filePath = path.join(os.tmpdir(), fileName);
                    fs.writeFileSync(filePath, content);
                    const uploadedFile = await this.uploadFile(filePath);
                    if (this.currentThreadId) {
                        await this.addFilesToVectorStore(this.currentThreadId, [uploadedFile]);
                    } else {
                        this.logSystemEvent('Warning: No current thread ID available. File uploaded but not added to vector store.');
                    }
                    fs.unlinkSync(filePath); // Clean up the temporary file
                    return `File ${fileName} uploaded successfully`;
                } catch (error) {
                    this.logSystemEvent(`Error uploading file: ${error.message}`);
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
            this.logSystemEvent("Tool outputs submitted successfully.");
            return await this.client.beta.threads.runs.retrieve(thread_id, run_id);
        } catch (error) {
            console.error("Error submitting tool outputs:", error);
            throw error;
        }
    }

    async messageSubAssistant(subAssistantName, message) {
        this.logSystemEvent(`Messaging Sub-assistant: ${subAssistantName}`);

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
            this.logSystemEvent(`Received response from Sub-assistant ${subAssistantName}: ${JSON.stringify(response)}`);
            return response;
        } catch (error) {
            console.error(`Error processing message with sub-assistant ${subAssistantName}:`, error);
            return `Error: Unable to process message. ${error.message}`;
        }
    }

    // Method to create a new thread for a sub-assistant
    async createNewThread(subAssistantName) {
        const newThread = await this.createThread({ metadata: { subAssistant: subAssistantName } }); // Create a new thread
        this.subAssistantThreads[subAssistantName] = newThread.id; // Store the thread ID
        this.logSystemEvent(`Created new thread for Sub-assistant ${subAssistantName}: ${newThread.id}`); // Log the creation of the new thread
        return newThread.id; // Return the thread ID
    }

    // Method to format a message for a sub-assistant
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

    // Method to create a response message
    createResponseMessage(response, subAssistant) {
        return {
            sender: {
                id: subAssistant.assistantId,
                name: subAssistant.assistantName
            },
            receiver: {
                id: this.assistantId,
                name: this.assistantName
            },
            content: response
        };
    }

    // Method to create an error message
    createErrorMessage(error, subAssistant) {
        return {
            sender: {
                id: subAssistant.assistantId,
                name: subAssistant.assistantName
            },
            receiver: {
                id: this.assistantId,
                name: this.assistantName
            },
            content: `Error: Unable to process message. ${error.message}`
        };
    }

    // Method to delete all assistants (main and sub-assistants)
    async deleteAllAssistants() {
        this.logSystemEvent('Deleting Main assistant'); // Log the deletion of the main assistant
        await this.deleteAssistant(this.assistantId); // Delete the main assistant
        this.assistantId = null; // Reset the main assistant's ID

        this.logSystemEvent('Deleting sub-assistants...'); // Log the deletion of sub-assistants
        await Promise.all(Object.entries(this.subAssistants).map(([name, assistant]) => this.deleteAssistant(assistant.assistantId, name))); // Delete all sub-assistants
        this.logSystemEvent('All assistants deleted'); // Log that all assistants are deleted

        await this.deleteAllVectorStores();
    }

    // Method to delete a specific assistant
    async deleteAssistant(assistantId, name = '') {
    if (assistantId) {
        try {
            await this.client.beta.assistants.del(assistantId); // Delete the assistant using the API
            console.log(`Assistant ${name} (${assistantId}) deleted`); // Log the deletion
        } catch (error) {
            console.error(`Error deleting assistant ${name} (${assistantId}):`, error); // Log any errors
        }
    }
}

    async deleteAllVectorStores() {
        this.logSystemEvent('Deleting all vector stores');
        try {
            const vectorStores = await this.client.beta.vectorStores.list();
            for (const vectorStore of vectorStores.data) {
                await this.client.beta.vectorStores.del(vectorStore.id);
                this.logSystemEvent(`Deleted vector store: ${vectorStore.id}`);
            }
            this.vectorStores = {};
            this.threadVectorStores = {};
            this.logSystemEvent('All vector stores deleted');
        } catch (error) {
            this.logSystemEvent(`Error deleting vector stores: ${error.message}`);
            throw error;
        }
    }

// Method to log system events
logSystemEvent(message) {
    console.log(`[System Event] ${message}`);
    this.addSystemLog(message); // Add a log message to the system logs
}

// Method to get system logs
getSystemLogs() {
    return super.getSystemLogs(); // Call the parent class method to get system logs
}

// Method to get and clear system logs
getAndClearSystemLogs() {
    const logs = this.getSystemLogs();
    this.clearSystemLogs();
    return logs;
}

}

module.exports = MainAssistantService;