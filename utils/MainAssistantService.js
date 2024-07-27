//MainAssistantService.js
const BaseAssistantService = require('./BaseAssistantService');

class MainAssistantService extends BaseAssistantService {
    constructor(apiKey) {
        super(apiKey);
        this.assistantId = null;
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
        
        When you need specific financial or technical information, use the messageSubAssistant function to request it.
        Always provide clear explanations and justify your analysis.
        Be conversational and engaging in your responses. Remember the context of the ongoing conversation.`;
    }

    async initialize({ model, name }) {
        const messageSubAssistantTool = {
            type: "function",
            function: {
                name: "messageSubAssistant",
                description: "Simulate sending a message to a specific sub-assistant",
                parameters: {
                    type: "object",
                    properties: {
                        subAssistantName: {
                            type: "string",
                            description: "The name of the sub-assistant to message",
                            enum: ["financial", "technical"]  // Example sub-assistants
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
        console.log('Main Assistant initialized:', newAssistant);
    }

    async handleRequiresAction(thread_id, run) {
        console.log('Handling required action...');
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
                        result = `Simulated message to ${parsedArgs.subAssistantName} assistant: "${parsedArgs.message}"`;
                        console.log(result);
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

    async chatWithAssistant(thread_id, assistant_id, userMessage) {
        return await super.chatWithAssistant(thread_id, assistant_id, userMessage);
    }
}

module.exports = MainAssistantService;