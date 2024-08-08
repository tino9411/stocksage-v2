const OpenAI = require('openai');
const connectDB = require('../config/db');
const { EventEmitter } = require('events');
const Assistant = require('../models/Assistant');
const mime = require('mime');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

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
        this.vectorStores = {};
        this.threadVectorStores = {};
        this.currentThreadId = null;
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
            this.addSystemLog(`Created Assistant: ${JSON.stringify(assistant, null, 2)}`);
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
            
            // Remove any null or undefined values
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

    async createThread({ messages = [], tool_resources = null, metadata = {} }) {
        try {
            const threadOptions = { tool_resources, metadata };
            if (messages.length > 0) {
                threadOptions.messages = messages;
            }
            return await this.client.beta.threads.create(threadOptions);
        } catch (error) {
            this.addSystemLog(`Error creating thread: ${error.message}`);
            throw error;
        }
    }

    async retrieveThread(thread_id) {
        try {
            return await this.client.beta.threads.retrieve(thread_id);
        } catch (error) {
            this.addSystemLog(`Error retrieving thread: ${error.message}`);
            throw error;
        }
    }

    async modifyThread(thread_id, { tool_resources = null, metadata = {} }) {
        try {
            return await this.client.beta.threads.update(thread_id, {
                tool_resources,
                metadata,
            });
        } catch (error) {
            this.addSystemLog(`Error modifying thread: ${error.message}`);
            throw error;
        }
    }

    async deleteThread(thread_id) {
        try {
            return await this.client.beta.threads.del(thread_id);
        } catch (error) {
            this.addSystemLog(`Error deleting thread: ${error.message}`);
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

    async retrieveMessage(thread_id, message_id) {
        try {
            return await this.client.beta.threads.messages.retrieve(thread_id, message_id);
        } catch (error) {
            this.addSystemLog(`Error retrieving message: ${error.message}`);
            throw error;
        }
    }

    async modifyMessage(thread_id, message_id, { metadata = {} }) {
        try {
            return await this.client.beta.threads.messages.update(thread_id, message_id, {
                metadata,
            });
        } catch (error) {
            this.addSystemLog(`Error modifying message: ${error.message}`);
            throw error;
        }
    }

    async deleteMessage(thread_id, message_id) {
        try {
            return await this.client.beta.threads.messages.del(thread_id, message_id);
        } catch (error) {
            this.addSystemLog(`Error deleting message: ${error.message}`);
            throw error;
        }
    }

    async processMessage(message, thread_id) {
        // This method should be implemented by each sub-assistant
        throw new Error('processMessage must be implemented by subclass');
    }

    async handleRunStatus(thread_id, run) {
        this.addSystemLog(`Handling run status: ${run ? run.status : 'undefined'}`);
        while (run) {
            switch (run.status) {
                case 'queued':
                case 'in_progress':
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    run = await this.client.beta.threads.runs.retrieve(thread_id, run.id);
                    this.addSystemLog(`Run status updated: ${run.status}`);
                    break;
                case 'requires_action':
                    run = await this.handleRequiresAction(thread_id, run);
                    break;
                case 'completed':
                    this.addSystemLog('Run completed. Retrieving messages...');
                    const steps = await this.getRunSteps(thread_id, run.id);
                    this.logRunSteps(steps);
                    const messages = await this.listMessages(thread_id);
                    const assistantMessages = messages.filter(message => message.role === 'assistant');
                    if (assistantMessages.length > 0) {
                        const latestMessage = assistantMessages[0].content[0].text.value;
                        this.addSystemLog('Assistant response received');
                        return latestMessage;
                    } else {
                        this.addSystemLog('No assistant messages found');
                        return null;
                    }
                case 'failed':
                case 'cancelled':
                case 'expired':
                    this.addSystemLog(`Run ended with status: ${run.status}`);
                    return null;
                default:
                    this.addSystemLog(`Unknown run status: ${run.status}`);
                    return null;
            }
        }
        this.addSystemLog('Run object is undefined');
        return null;
    }

    async handleRequiresAction(thread_id, run) {
        // This method should be implemented by subclasses
        throw new Error('handleRequiresAction must be implemented by subclass');
    }

    async chatWithAssistant(thread_id, assistant_id, userMessage) {
        this.addSystemLog(`Chat Started - Assistant: ${assistant_id}, Thread: ${thread_id}`);
        this.addSystemLog(`User Message: ${userMessage}`);
        try {
            await this.createMessage(thread_id, {
                role: 'user',
                content: userMessage,
            });
    
            let run = await this.client.beta.threads.runs.create(thread_id, {
                assistant_id,
                instructions: "Please respond to the user's message.",
            });
    
            this.addSystemLog(`Run Created - Run ID: ${run.id}`);
    
            let response = await this.handleRunStatus(thread_id, run);
            if (response) {
                this.addSystemLog('Assistant Responded');
                response = await this.processCodeInterpreterOutput(response);
                return response;
            } else {
                this.addSystemLog('No Response');
                return null;
            }
        } catch (error) {
            this.addSystemLog(`Error: ${error.message}`);
            throw error;
        }
    }

    async getRunSteps(thread_id, run_id) {
        try {
            const steps = await this.client.beta.threads.runs.steps.list(thread_id, run_id);
            return steps.data;
        } catch (error) {
            this.addSystemLog(`Error retrieving run steps: ${error.message}`);
            return [];
        }
    }

    logRunSteps(steps) {
        this.addSystemLog('Run Steps:');
        steps.forEach((step, index) => {
          this.addSystemLog(`Step ${index + 1}: ${step.type} - ${step.status}`);
          if (step.step_details && step.step_details.tool_calls) {
            step.step_details.tool_calls.forEach(call => {
              this.addSystemLog(`Tool: ${call.type}`);
              if (call.function) {
                this.addSystemLog(`Function: ${call.function.name}`);
                this.addSystemLog(`Arguments: ${call.function.arguments}`);
              }
            });
          }
        });
    }

    async initialize({ model, name }) {
        // This method should be implemented by each sub-assistant
        throw new Error('initialize must be implemented by subclass');
    }

    async uploadAndProcessFile(filePath) {
        this.addSystemLog(`Starting file upload and processing for: ${filePath}`);
        const fileName = path.basename(filePath);
        const fileStream = fs.createReadStream(filePath);
        const mimeType = mime.lookup(filePath) || 'application/octet-stream';
      
        this.addSystemLog(`Uploading file: ${fileName} (MIME: ${mimeType})`);
      
        try {
            const file = await this.client.files.create({
                file: fileStream,
                purpose: 'assistants',
            });
          
            this.addSystemLog(`File uploaded successfully: ${file.id} (${fileName}, MIME: ${mimeType})`);
            return { id: file.id, name: fileName, mimeType };
        } catch (error) {
            this.addSystemLog(`Error uploading file: ${error.message}`);
            throw error;
        }
    }

    async deleteFile(fileId) {
        try {
            const response = await this.client.files.del(fileId);
            this.addSystemLog(`Deleted file: ${fileId}`);
            return response;
        } catch (error) {
            this.addSystemLog(`Error deleting file: ${error.message}`);
            throw error;
        }
    }

    async createVectorStore(name, files) {
        this.addSystemLog(`Creating vector store: ${name}`);
        try {
            const vectorStore = await this.client.beta.vectorStores.create({
                name: name,
                file_ids: files.map(file => file.id)
            });
            this.vectorStores[name] = vectorStore.id;
            this.addSystemLog(`Vector store created: ${vectorStore.id}`);
            return vectorStore.id;
        } catch (error) {
            this.addSystemLog(`Error creating vector store: ${error.message}`);
            throw error;
        }
    }

    async addFilesToVectorStore(vectorStoreId, files) {
        this.addSystemLog(`Adding files to vector store: ${vectorStoreId}`);
        try {
            const batch = await this.client.beta.vectorStores.fileBatches.createAndPoll(
                vectorStoreId,
                { file_ids: files.map(file => file.id) }
            );
            this.addSystemLog(`Files added to vector store: ${vectorStoreId}`);
            return batch;
        } catch (error) {
            this.addSystemLog(`Error adding files to vector store: ${error.message}`);
            throw error;
        }
    }

    async attachVectorStoreToAssistant(vectorStoreId) {
        this.addSystemLog(`Attaching vector store ${vectorStoreId} to assistant ${this.assistantId}`);
        try {
            if (!this.assistantId || !this.assistantName) {
                throw new Error('Assistant ID or name is not set');
            }
            const currentAssistant = await this.retrieveAssistant(this.assistantId);
            await this.modifyAssistant(this.assistantId, {
                name: this.assistantName,
                description: currentAssistant.description || '',
                instructions: currentAssistant.instructions,
                model: currentAssistant.model,
                tools: currentAssistant.tools,
                tool_resources: { 
                    file_search: { 
                        vector_store_ids: [vectorStoreId] 
                    } 
                }
            });
            this.addSystemLog(`Vector store ${vectorStoreId} attached to assistant ${this.assistantId}`);
        } catch (error) {
            this.addSystemLog(`Error attaching vector store to assistant: ${error.message}`);
            throw error;
        }
    }

    async addFilesToConversation(filePaths) {
        try {
            const vectorStoreName = `ConversationStore_${this.currentThreadId}`;
            const uploadedFiles = await Promise.all(filePaths.map(filePath => this.uploadAndProcessFile(filePath)));
            
            // Create vector store with the uploaded files
            const vectorStoreId = await this.createVectorStore(vectorStoreName, uploadedFiles);
            await this.attachVectorStoreToAssistant(vectorStoreId);
    
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
    
            // Return the uploaded files with their vector store ID
            return uploadedFiles.map(file => ({ 
                id: file.id, 
                name: file.name, 
                vectorStoreId: vectorStoreId 
            }));
        } catch (error) {
            this.addSystemLog(`Error adding files to conversation: ${error.message}`);
            throw error;
        }
    }

    async deleteFileFromConversation(fileId, vectorStoreId) {
        try {
            // First, try to delete the file from the vector store
            await this.deleteVectorStoreFile(vectorStoreId, fileId);
            this.addSystemLog(`Deleted file ${fileId} from vector store ${vectorStoreId}`);

            // Then, delete the file itself
            await this.deleteFile(fileId);
            this.addSystemLog(`Deleted file ${fileId}`);

            return true;
        } catch (error) {
            this.addSystemLog(`Error deleting file from conversation: ${error.message}`);
            throw error;
        }
    }

    async getVectorStoreIdForThread(threadId) {
        try {
            const thread = await this.retrieveThread(threadId);
            if (thread.tool_resources && thread.tool_resources.file_search && thread.tool_resources.file_search.vector_store_ids) {
                return thread.tool_resources.file_search.vector_store_ids[0];
            }
            return null;
        } catch (error) {
            this.addSystemLog(`Error getting vector store ID for thread: ${error.message}`);
            throw error;
        }
    }

    async deleteAllVectorStores() {
        this.addSystemLog('Deleting all vector stores');
        try {
            const vectorStores = await this.client.beta.vectorStores.list();
            for (const vectorStore of vectorStores.data) {
                await this.client.beta.vectorStores.del(vectorStore.id);
                this.addSystemLog(`Deleted vector store: ${vectorStore.id}`);
            }
            this.vectorStores = {};
            this.threadVectorStores = {};
            this.addSystemLog('All vector stores deleted');
        } catch (error) {
            this.addSystemLog(`Error deleting vector stores: ${error.message}`);
            throw error;
        }
    }

    async listVectorStores(options = {}) {
        try {
            const { limit = 20, order = 'desc', after = null, before = null } = options;
            const vectorStores = await this.client.beta.vectorStores.list({
                limit,
                order,
                after,
                before,
            });
            this.addSystemLog(`Listed ${vectorStores.data.length} vector stores`);
            return vectorStores.data;
        } catch (error) {
            this.addSystemLog(`Error listing vector stores: ${error.message}`);
            throw error;
        }
    }

    async retrieveVectorStore(vectorStoreId) {
        try {
            const vectorStore = await this.client.beta.vectorStores.retrieve(vectorStoreId);
            this.addSystemLog(`Retrieved vector store: ${vectorStore.id}`);
            return vectorStore;
        } catch (error) {
            this.addSystemLog(`Error retrieving vector store: ${error.message}`);
            throw error;
        }
    }

    async updateVectorStore(vectorStoreId, updateParams) {
        try {
            const updatedVectorStore = await this.client.beta.vectorStores.update(vectorStoreId, updateParams);
            this.addSystemLog(`Updated vector store: ${updatedVectorStore.id}`);
            return updatedVectorStore;
        } catch (error) {
            this.addSystemLog(`Error updating vector store: ${error.message}`);
            throw error;
        }
    }

    async deleteVectorStore(vectorStoreId) {
        try {
            const response = await this.client.beta.vectorStores.del(vectorStoreId);
            this.addSystemLog(`Deleted vector store: ${vectorStoreId}`);
            return response;
        } catch (error) {
            this.addSystemLog(`Error deleting vector store: ${error.message}`);
            throw error;
        }
    }

    async listVectorStoreFiles(vectorStoreId, options = {}) {
        try {
            const { limit = 20, order = 'desc', after = null, before = null, filter = null } = options;
            const files = await this.client.beta.vectorStores.files.list(vectorStoreId, {
                limit,
                order,
                after,
                before,
                filter,
            });
            this.addSystemLog(`Listed ${files.data.length} vector store files`);
            return files.data;
        } catch (error) {
            this.addSystemLog(`Error listing vector store files: ${error.message}`);
            throw error;
        }
    }

    async retrieveVectorStoreFile(vectorStoreId, fileId) {
        try {
            const file = await this.client.beta.vectorStores.files.retrieve(vectorStoreId, fileId);
            this.addSystemLog(`Retrieved vector store file: ${file.id}`);
            return file;
        } catch (error) {
            this.addSystemLog(`Error retrieving vector store file: ${error.message}`);
            throw error;
        }
    }

    async deleteVectorStoreFile(vectorStoreId, fileId) {
        try {
            const response = await this.client.beta.vectorStores.files.del(vectorStoreId, fileId);
            this.addSystemLog(`Deleted vector store file: ${fileId}`);
            return response;
        } catch (error) {
            this.addSystemLog(`Error deleting vector store file: ${error.message}`);
            throw error;
        }
    }

    async processCodeInterpreterOutput(message) {
        this.addSystemLog(`Processing Code Interpreter output: ${JSON.stringify(message)}`);
        
        if (typeof message === 'string') {
            this.addSystemLog('Message is a string, returning as-is');
            return message;
        }
    
        if (!message || !message.content) {
            this.addSystemLog('Message is empty or has no content, returning as-is');
            return message;
        }
    
        const contents = Array.isArray(message.content) ? message.content : [message.content];
    
        for (const content of contents) {
            if (content.type === 'image_file') {
                this.addSystemLog(`Processing image file: ${JSON.stringify(content.image_file)}`);
                const fileId = content.image_file.file_id;
                const imageUrl = await this.downloadAndSaveFile(fileId, 'image');
                if (imageUrl) {
                    content.image_file.url = imageUrl;
                    this.addSystemLog(`Image URL set to: ${imageUrl}`);
                }
            } else if (content.type === 'text') {
                const text = content.text.value || content.text;
                if (text && typeof text === 'object' && text.annotations) {
                    for (const annotation of text.annotations) {
                        if (annotation.type === 'file_path') {
                            this.addSystemLog(`Processing file path annotation: ${JSON.stringify(annotation)}`);
                            const fileId = annotation.file_path.file_id;
                            const fileUrl = await this.downloadAndSaveFile(fileId, 'data');
                            if (fileUrl) {
                                text.value = text.value.replace(
                                    annotation.text,
                                    `[${annotation.text}](${fileUrl})`
                                );
                                this.addSystemLog(`File URL set to: ${fileUrl}`);
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
            this.addSystemLog(`Attempting to download file: ${fileId}`);
            const response = await this.client.files.content(fileId);
            this.addSystemLog(`File content retrieved for: ${fileId}`);
            
            const buffer = Buffer.from(await response.arrayBuffer());
            const fileName = `${type}_${fileId}.${type === 'image' ? 'png' : 'csv'}`;
            
            const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
            this.addSystemLog(`Uploads directory: ${uploadsDir}`);
            
            if (!fs.existsSync(uploadsDir)) {
                this.addSystemLog(`Creating uploads directory: ${uploadsDir}`);
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            
            const filePath = path.join(uploadsDir, fileName);
            this.addSystemLog(`Saving file to: ${filePath}`);
            
            fs.writeFileSync(filePath, buffer);
            this.addSystemLog(`File saved successfully: ${filePath}`);
            
            return `/api/files/${fileName}`;
        } catch (error) {
            this.addSystemLog(`Error downloading file ${fileId}: ${error.message}`);
            return null;
        }
    }
}

module.exports = BaseAssistantService;