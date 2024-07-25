// testAssistant.js
import AssistantService from './utils/assistantService.js';
const connectDB = require('./config/db'); // Import the database connection function
const Stock = require('./models/Stock');
require('dotenv').config();

async function runTests() {
    await connectDB(); // Connect to the database

    const apiKey = process.env.OPENAI_API_KEY; // Ensure your API key is in the .env file
    const assistantService = new AssistantService(apiKey);
    const symbol = 'AAPL'; // Example symbol

    // Define the tools to be used by the assistant
    const tools = [
        'fetchCompanyProfile',
        'fetchHistoricalData',
        'fetchRealTimeQuote',
        'fetchIncomeStatement',
        'fetchBalanceSheet',
        'fetchCashFlowStatement',
        'fetchKeyMetrics',
        'calculateTechnicalIndicators'
    ];

    // Create an assistant with the required tools
    const newAssistant = await assistantService.createAssistant({
        model: 'gpt-4o',
        name: 'Finance Assistant',
        instructions: 'You are a finance assistant that helps with stock market data.',
        tools: tools, // Pass all available tools dynamically
    });
    const assistantId = newAssistant.id;

    // Delete the assistant when done
    const deleteResponse = await assistantService.deleteAssistant(assistantId);
    console.log('Deleted Assistant:', deleteResponse);
}

runTests().catch(error => {
    console.error('Error running tests:', error);
});