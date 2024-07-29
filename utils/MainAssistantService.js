// Importing the base service and sub-assistant classes
const BaseAssistantService = require('./BaseAssistantService');
const CompanyProfileAssistant = require('./CompanyProfileAssistant');
const FinancialAnalysisAssistant = require('./FinancialAnalysisAssistant');
const TechnicalAnalysisAssistant = require('./TechnicalAnalysisAssistant');

// Define the MainAssistantService class, extending the BaseAssistantService
class MainAssistantService extends BaseAssistantService {
    // Constructor to initialize the MainAssistantService instance
    constructor(apiKey) {
        super(apiKey); // Call the parent class constructor
        this.assistantId = null; // Store the main assistant's ID
        this.assistantName = 'MainAssistant'; // Name of the main assistant
        this.subAssistants = {}; // Object to store sub-assistants
        this.subAssistantThreads = {}; // Object to store threads for sub-assistants
        this.instructions = this.getInstructions(); // Instructions for the main assistant
    }

    // Method to get instructions for the main assistant
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
        6. A summary and recommendation (buy, sell or hold). Include a recommended entry price.
        
        When you need specific information, use the messageSubAssistant function to request it from the appropriate sub-assistant.
        Always provide clear explanations and justify your analysis.
        Be conversational and engaging in your responses. Remember the context of the ongoing conversation.`;
    }

    // Method to initialize the main assistant and its sub-assistants
    async initialize({ model, name }) {
        this.logSystemEvent('Initializing Main Assistant'); // Log the initialization process
        await this.initializeMainAssistant(model, name); // Initialize the main assistant
        await this.initializeSubAssistants(model); // Initialize the sub-assistants
    }

    // Method to initialize the main assistant
    async initializeMainAssistant(model, name) {
        const messageSubAssistantTool = this.getMessageSubAssistantTool(); // Get the tool for messaging sub-assistants
        const newAssistant = await this.createAssistant({
            model,
            name,
            instructions: this.instructions,
            tools: [messageSubAssistantTool]
        });
        this.assistantId = newAssistant.id; // Store the main assistant's ID
        this.logSystemEvent('Main Assistant initialized'); // Log that the main assistant is initialized
    }

    // Method to get the tool for messaging sub-assistants
    getMessageSubAssistantTool() {
        return {
            type: "function",
            function: {
                name: "messageSubAssistant",
                description: "Send a message to a specific sub-assistant",
                parameters: {
                    type: "object",
                    properties: {
                        subAssistantName: {
                            type: "string",
                            description: "The name of the sub-assistant to message",
                            enum: ["CompanyProfile", "FinancialAnalysis", "TechnicalAnalysis"]
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

    // Method to initialize all sub-assistants
    async initializeSubAssistants(model) {
        this.logSystemEvent('Initializing Sub-assistants'); // Log the initialization of sub-assistants
        await this.initializeSubAssistant('CompanyProfile', CompanyProfileAssistant, model);
        await this.initializeSubAssistant('FinancialAnalysis', FinancialAnalysisAssistant, model);
        await this.initializeSubAssistant('TechnicalAnalysis', TechnicalAnalysisAssistant, model);
        this.logSystemEvent('All sub-assistants initialized'); // Log that all sub-assistants are initialized
    }

    // Method to initialize a specific sub-assistant
    async initializeSubAssistant(name, AssistantClass, model) {
        const assistant = new AssistantClass(this.apiKey); // Create an instance of the sub-assistant
        await assistant.initialize({ model, name }); // Initialize the sub-assistant
        this.subAssistants[name] = assistant; // Store the sub-assistant in the subAssistants object
        this.logSystemEvent(`Sub-assistant ${name} initialized`); // Log that the sub-assistant is initialized
    }

    async chatWithAssistant(thread_id, assistant_id, userMessage, stream = false) {
        // Call the base class implementation first
        const baseResponse = await super.chatWithAssistant(thread_id, assistant_id, userMessage, stream);

        // If streaming is enabled, return the base response as is
        if (stream) {
            return baseResponse;
        }

        // For non-streaming responses, check if we need to process sub-assistant responses
        if (baseResponse) {
            // Check if the response contains any indicators that sub-assistant information is needed
            if (this.responseRequiresSubAssistant(baseResponse)) {
                const enhancedResponse = await this.enhanceResponseWithSubAssistantInfo(baseResponse, thread_id);
                return enhancedResponse;
            }
        }

        return baseResponse;
    }

    responseRequiresSubAssistant(response) {
        // Implement logic to determine if the response needs sub-assistant input
        // This could be based on keywords, specific phrases, or other criteria
        const subAssistantKeywords = ['company profile', 'financial analysis', 'technical analysis'];
        return subAssistantKeywords.some(keyword => response.toLowerCase().includes(keyword));
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