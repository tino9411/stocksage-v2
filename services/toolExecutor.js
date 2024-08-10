// services/toolExecutor.js

const Assistant = require('../models/Assistant');
const CompanyProfileAssistant = require('../assistants/CompanyProfileAssistant');
const FinancialAnalysisAssistant = require('../assistants/FinancialAnalysisAssistant');
const TechnicalAnalysisAssistant = require('../assistants/TechnicalAnalysisAssistant');
const EconomicDataAssistant = require('../assistants/EconomicDataAssistant');
const SentimentAnalysisAssistant = require('../assistants/SentimentAnalysisAssistant');
const path = require('path');
const fs = require('fs');
const os = require('os');

class ToolExecutor {
    constructor(chat) {
        this.chat = chat;
        this.subAssistants = {};
    }

    async executeToolCall(toolCall) {
        const { id, function: { name, arguments: args } } = toolCall;
        const parsedArgs = JSON.parse(args);
        console.log(`Executing tool call: ${name} with arguments:`, parsedArgs);

        try {
            let result;
            switch (name) {
                case 'messageSubAssistant':
                    result = await this.messageSubAssistant(parsedArgs.subAssistantName, parsedArgs.message);
                    break;
                case 'uploadFile':
                    result = await this.uploadFile(parsedArgs);
                    break;
                default:
                    throw new Error(`Unknown function ${name}`);
            }
            return this.createToolOutput(id, result);
        } catch (error) {
            console.error(`Error executing tool ${name}:`, error);
            return this.createToolOutput(id, { error: error.message });
        }
    }

    async messageSubAssistant(subAssistantName, message) {
    console.log(`Messaging Sub-assistant: ${subAssistantName}`);
    let subAssistant = this.subAssistants[subAssistantName];
    if (!subAssistant) {
        subAssistant = await this.getOrCreateSubAssistant(subAssistantName);
    }
    
    let threadId = this.chat.subAssistantThreads[subAssistantName];
    if (!threadId) {
        // Change this line
        threadId = await this.chat.createNewThread();
        this.chat.subAssistantThreads[subAssistantName] = threadId;
    }
    
    const formattedMessage = this.formatMessage(message, subAssistant);
    try {
        const response = await subAssistant.processMessage(formattedMessage, threadId);
        console.log(`Received response from Sub-assistant ${subAssistantName}:`, response);
        return response;
    } catch (error) {
        console.error(`Error processing message with sub-assistant ${subAssistantName}:`, error);
        return `Error: Unable to process message. ${error.message}`;
    }
}

    async getOrCreateSubAssistant(subAssistantName) {
        const savedAssistant = await Assistant.findOne({ name: subAssistantName });
        if (!savedAssistant) {
            throw new Error(`Sub-assistant ${subAssistantName} not found in database`);
        }

        const AssistantClass = this.getAssistantClass(subAssistantName);
        const subAssistant = new AssistantClass(this.chat.client.apiKey);
        subAssistant.assistantId = savedAssistant.assistantId;
        subAssistant.assistantName = subAssistantName;
        this.subAssistants[subAssistantName] = subAssistant;

        return subAssistant;
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
                id: this.chat.assistantId,
                name: this.chat.assistantName
            },
            receiver: {
                id: subAssistant.assistantId,
                name: subAssistant.assistantName
            },
            content: message
        };
    }

    async uploadFile(parsedArgs) {
        try {
            const { fileName, content } = parsedArgs;
            const filePath = path.join(os.tmpdir(), fileName);
            fs.writeFileSync(filePath, content);
            const uploadedFile = await this.chat.uploadAndProcessFile(filePath);
            if (this.chat.currentThreadId) {
                const vectorStoreName = `ThreadStore_${this.chat.currentThreadId}`;
                await this.chat.uploadFilesAndCreateVectorStore(vectorStoreName, [filePath]);
            } else {
                console.log('Warning: No current thread ID available. File uploaded but not added to vector store.');
            }
            fs.unlinkSync(filePath); // Clean up the temporary file
            return `File ${fileName} uploaded successfully`;
        } catch (error) {
            console.error(`Error uploading file:`, error);
            return `Error uploading file: ${error.message}`;
        }
    }

    createToolOutput(tool_call_id, result) {
        return {
            tool_call_id,
            output: JSON.stringify(result),
        };
    }
}

module.exports = ToolExecutor;