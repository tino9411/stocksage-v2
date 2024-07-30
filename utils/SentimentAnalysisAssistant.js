// utils/SentimentAnalysisAssistant.js
const BaseAssistantService = require('./BaseAssistantService');
const {
    fetchHistoricalSocialSentiment,
    fetchTrendingSocialSentiment,
    fetchSocialSentimentChanges
} = require('../services/SentimentAnalysisTools');

class SentimentAnalysisAssistant extends BaseAssistantService {
    constructor(apiKey) {
        super(apiKey);
        this.assistantId = null;
        this.assistantName = 'SentimentAnalysis';
        this.instructions = `You are a sentiment analysis specialist. Your role is to provide detailed information about social sentiment for stocks and companies when requested. This includes:
        1. Historical social sentiment data
        2. Trending social sentiment
        3. Changes in social sentiment over time
        
        Use the provided functions to retrieve the most up-to-date sentiment information:
        - fetchHistoricalSocialSentiment: Get historical social sentiment data for a specific stock
        - fetchTrendingSocialSentiment: Get trending social sentiment data
        - fetchSocialSentimentChanges: Get changes in social sentiment over time
        
        If the information is not available or there's an error, inform the user and provide any alternative information you can.
        Always provide concise but comprehensive information, including your interpretation of the sentiment data.`;
    }

    async initialize({ model, name }) {
        const tools = [
            this.createHistoricalSentimentTool(),
            this.createTrendingSentimentTool(),
            this.createSentimentChangesTool()
        ];

        const newAssistant = await this.createAssistant({
            model,
            name,
            instructions: this.instructions,
            tools: tools
        });
        this.assistantId = newAssistant.id;
        console.log('Sentiment Analysis Assistant initialized:', newAssistant);
    }

    createHistoricalSentimentTool() {
        return {
            type: "function",
            function: {
                name: "fetchHistoricalSocialSentiment",
                description: "Fetch historical social sentiment data for a given stock symbol",
                parameters: {
                    type: "object",
                    properties: {
                        symbol: {
                            type: "string",
                            description: "The stock symbol"
                        }
                    },
                    required: ["symbol"]
                }
            }
        };
    }

    createTrendingSentimentTool() {
        return {
            type: "function",
            function: {
                name: "fetchTrendingSocialSentiment",
                description: "Fetch trending social sentiment data",
                parameters: {
                    type: "object",
                    properties: {
                        type: {
                            type: "string",
                            enum: ["bullish", "bearish"],
                            description: "The type of sentiment"
                        },
                        source: {
                            type: "string",
                            enum: ["stocktwits", "twitter"],
                            description: "The source of sentiment data"
                        }
                    },
                    required: ["type", "source"]
                }
            }
        };
    }

    createSentimentChangesTool() {
        return {
            type: "function",
            function: {
                name: "fetchSocialSentimentChanges",
                description: "Fetch changes in social sentiment over time",
                parameters: {
                    type: "object",
                    properties: {
                        type: {
                            type: "string",
                            enum: ["bullish", "bearish"],
                            description: "The type of sentiment"
                        },
                        source: {
                            type: "string",
                            enum: ["stocktwits", "twitter"],
                            description: "The source of sentiment data"
                        }
                    },
                    required: ["type", "source"]
                }
            }
        };
    }

    async processMessage(message, threadId) {
        console.log(`Processing message in SentimentAnalysisAssistant: ${message.content}`);
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
            console.error('Error processing message in SentimentAnalysisAssistant:', error);
            return `I apologize, but I encountered an error while processing your request. ${error.message}`;
        }
    }

    async handleRequiresAction(thread_id, run) {
        console.log('Handling required action in SentimentAnalysisAssistant...');
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
                    switch (name) {
                        case 'fetchHistoricalSocialSentiment':
                            result = await fetchHistoricalSocialSentiment(parsedArgs.symbol);
                            break;
                        case 'fetchTrendingSocialSentiment':
                            result = await fetchTrendingSocialSentiment(parsedArgs.type, parsedArgs.source);
                            break;
                        case 'fetchSocialSentimentChanges':
                            result = await fetchSocialSentimentChanges(parsedArgs.type, parsedArgs.source);
                            break;
                        default:
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
                console.log("Tool outputs submitted successfully in SentimentAnalysisAssistant.");
            } catch (error) {
                console.error("Error submitting tool outputs in SentimentAnalysisAssistant:", error);
                throw error;
            }
        }
        return run;
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
            console.error('Run failed:', run.last_error);
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

module.exports = SentimentAnalysisAssistant;