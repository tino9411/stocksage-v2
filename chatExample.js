// chatExample.js
const Chat = require('./services/chat');
const readline = require('readline');
require('dotenv').config();

const apiKey = process.env.OPENAI_API_KEY;
const chatService = new Chat(apiKey);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function askQuestion(query) {
    return new Promise((resolve) => rl.question(query, resolve));
}

async function chat() {
    try {
        console.log('Initializing chat...');
        await chatService.initializeAssistant({
            model: 'gpt-4o-mini',
            name: 'Chat Assistant',
            instructions: `You are a stock analysis assistant. Your role is to analyze stock data and provide insightful reports.
                You have access to various financial data and metrics for stocks. When asked about a specific stock,
                you should retrieve the necessary data, process it, and provide a comprehensive analysis.
                Your analysis should include:
                1. Basic stock information (price, volume, market cap)
                2. Fundamental Analysis
                3. Technical indicators (moving averages, RSI, MACD)
                4. Financial ratios and metrics
                5. Potential risks and opportunities
                6. A summary and recommendation (buy, sell or hold). Include a recommended entry price.
                
                Use the provided tools to fetch and analyze data. Always provide clear explanations and justify your analysis.
                Be conversational and engaging in your responses. Remember the context of the ongoing conversation.`,
        });

        console.log('Starting conversation...');
        const initialMessage = await askQuestion('You: ');
        console.log('Sending initial message:', initialMessage);
        const initialResponse = await chatService.startConversation(initialMessage);
        console.log('Assistant:', initialResponse);

        while (true) {
            const userMessage = await askQuestion('You: ');
            if (userMessage.toLowerCase() === 'exit') {
                break;
            }
            const assistantResponse = await chatService.sendMessage(userMessage);
            console.log('Assistant:', assistantResponse);
        }
    } catch (error) {
        console.error('Error during chat:', error);
    } finally {
        console.log('Ending conversation...');
        await chatService.endConversation();
        rl.close();
    }
}

// Handle CTRL+C
process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT. Cleaning up...');
    await chatService.endConversation();
    process.exit(0);
});

chat().catch((error) => {
    console.error('Unhandled error during chat:', error);
    chatService.endConversation().finally(() => {
        rl.close();
        process.exit(1);
    });
});