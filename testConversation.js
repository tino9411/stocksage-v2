const MainAssistantService = require('./assistants/MainAssistantService');
require('dotenv').config();
const connectDB = require('./config/db'); // Import the database connection function

async function testConversation() {
    const apiKey = process.env.OPENAI_API_KEY;
    const mainAssistant = new MainAssistantService(apiKey);
    await connectDB(); // Connect to the database

    try {
        console.log("Starting initialization...");
        await mainAssistant.initialize({ model: "gpt-4o-mini", name: "Financial Analyst" });
        console.log("Assistant initialized successfully");

        const conversation = [
            "Tell me about Apple's stock and its current market position.",
            "What's the latest insider trading information for Apple?",
            "Based on this information, what's your overall assessment of Apple's stock?"
        ];

        for (const message of conversation) {
            console.log(`\nUser: ${message}`);
            try {
                await mainAssistant.processMessage(message);
                // Note: The response will be processed asynchronously
            } catch (error) {
                console.error(`Error queuing message: ${error.message}`);
                console.error(error.stack);
            }
        }

        // Wait for all messages to be processed
        while (mainAssistant.messageQueue.length > 0 || mainAssistant.isProcessingQueue) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log("\nConversation completed successfully");
    } catch (error) {
        console.error("Error during conversation:", error);
        console.error(error.stack);
    } finally {
        try {
            await mainAssistant.deleteAllAssistants();
            console.log("All assistants and resources cleaned up");
        } catch (cleanupError) {
            console.error("Error during cleanup:", cleanupError);
            console.error(cleanupError.stack);
        }
    }
}

testConversation().catch(error => {
    console.error("Unhandled error:", error);
    console.error(error.stack);
});