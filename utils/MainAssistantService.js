const BaseAssistantService = require('./BaseAssistantService');
const CompanyProfileAssistant = require('./CompanyProfileAssistant');
const FinancialAnalysisAssistant = require('./FinancialAnalysisAssistant');
const TechnicalAnalysisAssistant = require('./TechnicalAnalysisAssistant');

class MainAssistantService extends BaseAssistantService {
    constructor(apiKey) {
        super(apiKey);
        this.assistantId = null;
        this.assistantName = 'MainAssistant';
        this.subAssistants = {};
        this.subAssistantThreads = {};
        this.instructions = `You are the main stock and financial analyst. Your role is to analyze stock data and provide insightful reports.
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

    async initialize({ model, name }) {
        this.addSystemLog('Initializing Main Assistant');
        const messageSubAssistantTool = {
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
    
        const newAssistant = await this.createAssistant({
            model,
            name,
            instructions: this.instructions,
            tools: [messageSubAssistantTool]
        });
        this.assistantId = newAssistant.id;
        this.addSystemLog('Main Assistant initialized');
    
        // Initialize sub-assistants
        this.addSystemLog('Initializing Sub-assistants');
        this.subAssistants.CompanyProfile = new CompanyProfileAssistant(this.apiKey);
        await this.subAssistants.CompanyProfile.initialize({ model, name: "CompanyProfile" });
        
        this.subAssistants.FinancialAnalysis = new FinancialAnalysisAssistant(this.apiKey);
        await this.subAssistants.FinancialAnalysis.initialize({ model, name: "FinancialAnalysis" });

        this.subAssistants.TechnicalAnalysis = new TechnicalAnalysisAssistant(this.apiKey);
        await this.subAssistants.TechnicalAnalysis.initialize({ model, name: "TechnicalAnalysis" });
        
        this.addSystemLog('All sub-assistants initialized');
    }
    async handleRequiresAction(thread_id, run) {
        this.addSystemLog('Handling required action');
        if (
            run.required_action &&
            run.required_action.submit_tool_outputs &&
            run.required_action.submit_tool_outputs.tool_calls
        ) {
            const toolOutputs = await Promise.all(run.required_action.submit_tool_outputs.tool_calls.map(async (tool) => {
                const { id, function: { name, arguments: args } } = tool;
                const parsedArgs = JSON.parse(args);
                try {
                    let result;
                    if (name === 'messageSubAssistant') {
                        result = await this.messageSubAssistant(parsedArgs.subAssistantName, parsedArgs.message);
                    } else {
                        throw new Error(`Unknown function ${name}`);
                    }
                    return {
                        tool_call_id: id,
                        output: JSON.stringify(result),
                    };
                } catch (error) {
                    console.error(`Error executing tool ${name}:`, error);
                    return {
                        tool_call_id: id,
                        output: JSON.stringify({ error: error.message }),
                    };
                }
            }));

            try {
                run = await this.client.beta.threads.runs.submitToolOutputs(
                    thread_id,
                    run.id,
                    { tool_outputs: toolOutputs },
                );
                console.log("Tool outputs submitted successfully.");
            } catch (error) {
                console.error("Error submitting tool outputs:", error);
                throw error;
            }
        }
        return run;
    }

    async messageSubAssistant(subAssistantName, message) {
        this.addSystemLog(`Messaging Sub-assistant: ${subAssistantName}`);
        const subAssistant = this.subAssistants[subAssistantName];
        if (!subAssistant) {
            console.error(`Sub-assistant ${subAssistantName} not found`);
            throw new Error(`Sub-assistant ${subAssistantName} not found`);
        }

        let threadId = this.subAssistantThreads[subAssistantName];
        if (!threadId) {
            // Create a new thread for this sub-assistant if it doesn't exist
            const newThread = await this.createThread({ metadata: { subAssistant: subAssistantName } });
            threadId = newThread.id;
            this.subAssistantThreads[subAssistantName] = threadId;
        }

        const formattedMessage = {
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

        this.addSystemLog(`Inter-assistant message: ${JSON.stringify(formattedMessage)}`);

        try {
            // Process the message with the sub-assistant
            const response = await subAssistant.processMessage(formattedMessage, threadId);

            const formattedResponse = {
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

            console.log(`Sub-assistant response: ${JSON.stringify(formattedResponse)}`);

            return formattedResponse;
        } catch (error) {
            console.error(`Error processing message with sub-assistant ${subAssistantName}:`, error);
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
    }

    async deleteAllAssistants() {
        this.addSystemLog('Deleting Main assistant');
        if (this.assistantId) {
          try {
            await this.client.beta.assistants.del(this.assistantId);
            console.log(`Main assistant ${this.assistantId} deleted`);
          } catch (error) {
            console.error(`Error deleting main assistant ${this.assistantId}:`, error);
          }
          this.assistantId = null;
        }
      
        console.log('Deleting sub-assistants...');
        for (const [name, assistant] of Object.entries(this.subAssistants)) {
          if (assistant.assistantId) {
            try {
              await this.client.beta.assistants.del(assistant.assistantId);
              console.log(`Sub-assistant ${name} (${assistant.assistantId}) deleted`);
            } catch (error) {
              console.error(`Error deleting sub-assistant ${name} (${assistant.assistantId}):`, error);
            }
            assistant.assistantId = null;
          }
        }
      
        this.addSystemLog('All assistants deleted');
      }

      // Ensure getSystemLogs is explicitly defined in MainAssistantService
  getSystemLogs() {
    return super.getSystemLogs();
  }

  // Add a method to clear logs after retrieving them
  getAndClearSystemLogs() {
    const logs = this.getSystemLogs();
    this.clearSystemLogs();
    return logs;
  }
}

module.exports = MainAssistantService;