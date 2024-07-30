const Chat = require('./Chat');

class Command {
    constructor(apiKey) {
        this.chat = new Chat(apiKey);
    }

    async handleCommand(command) {
        switch (true) {
            case /^\/analyse\s+\w+/.test(command):
                return await this.handleAnalyseCommand(command);
            default:
                throw new Error('Unknown command');
        }
    }

    async handleAnalyseCommand(command) {
        const stockSymbol = command.split(' ')[1];

        // Ensure the assistant is initialized and conversation started
        if (!this.chat.isInitialized) {
            await this.chat.initializeAssistant({ model: 'gpt-4o-mini', name: 'Stock Analysis Assistant' });
        }

        if (!this.chat.isConversationStarted) {
            await this.chat.startConversation(`Analyse ${stockSymbol}`);
        }

        // Send the message to get the analysis
        return await this.chat.streamMessage(`Please provide a comprehensive analysis of the stock ${stockSymbol}. Include financial metrics, recent performance, market position, and any relevant news or developments.`);
    }
}

module.exports = Command;