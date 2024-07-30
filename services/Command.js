const Chat = require('./Chat');

class Command {
    constructor(apiKey) {
        this.chat = new Chat(apiKey);
    }

    async handleCommand(command) {
        switch (true) {
            case /^\/analyse\s+\w+/.test(command):
                return await this.handleAnalyseCommand(command);
            case /^\/price\s+\w+/.test(command):
                return await this.handlePriceCommand(command);
            case /^\/news\s+\w+/.test(command):
                return await this.handleNewsCommand(command);
            case /^\/forecast\s+\w+/.test(command):
                return await this.handleForecastCommand(command);
            case /^\/history\s+\w+/.test(command):
                return await this.handleHistoryCommand(command);
            case /^\/compare\s+\w+\s+\w+/.test(command):
                return await this.handleCompareCommand(command);
            case /^\/recommendations\s+\w+/.test(command):
                return await this.handleRecommendationsCommand(command);
            case /^\/dividends\s+\w+/.test(command):
                return await this.handleDividendsCommand(command);
            case /^\/insights\s+\w+/.test(command):
                return await this.handleInsightsCommand(command);
            case /^\/insider\s+\w+/.test(command):
                return await this.handleInsiderCommand(command);
            case /^\/financials\s+\w+/.test(command):
                return await this.handleFinancialsCommand(command);
            case /^\/peers\s+\w+/.test(command):
                return await this.handlePeersCommand(command);
            case /^\/sentiment\s+\w+/.test(command):
                return await this.handleSentimentCommand(command);
            case /^\/risk\s+\w+/.test(command):
                return await this.handleRiskCommand(command);
            case /^\/events\s+\w+/.test(command):
                return await this.handleEventsCommand(command);
            case /^\/ownership\s+\w+/.test(command):
                return await this.handleOwnershipCommand(command);
            case /^\/technicals\s+\w+/.test(command):
                return await this.handleTechnicalsCommand(command);
            default:
                throw new Error('Unknown command');
        }
    }

    async initializeAndStartConversationIfNeeded(command, initialMessage) {
        if (!this.chat.isInitialized) {
            await this.chat.initializeAssistant({ model: 'gpt-4o-mini', name: 'Stock Analysis Assistant' });
        }

        if (!this.chat.isConversationStarted) {
            await this.chat.startConversation(initialMessage);
        }
    }

    async handleAnalyseCommand(command) {
        const stockSymbol = command.split(' ')[1];
        await this.initializeAndStartConversationIfNeeded(command, `Analyse ${stockSymbol}`);
        return await this.chat.streamMessage(`Please provide a comprehensive analysis of the stock ${stockSymbol}. Include financial metrics, recent performance, market position, and any relevant news or developments.`);
    }

    async handlePriceCommand(command) {
        const stockSymbol = command.split(' ')[1];
        await this.initializeAndStartConversationIfNeeded(command, `Get price of ${stockSymbol}`);
        return await this.chat.streamMessage(`What is the current price of the stock ${stockSymbol}?`);
    }

    async handleNewsCommand(command) {
        const stockSymbol = command.split(' ')[1];
        await this.initializeAndStartConversationIfNeeded(command, `Get news for ${stockSymbol}`);
        return await this.chat.streamMessage(`Please provide the latest news related to the stock ${stockSymbol}.`);
    }

    async handleForecastCommand(command) {
        const stockSymbol = command.split(' ')[1];
        await this.initializeAndStartConversationIfNeeded(command, `Forecast for ${stockSymbol}`);
        return await this.chat.streamMessage(`Please provide the price forecast for the stock ${stockSymbol}. Include predictions for short-term and long-term periods.`);
    }

    async handleHistoryCommand(command) {
        const stockSymbol = command.split(' ')[1];
        await this.initializeAndStartConversationIfNeeded(command, `Historical data for ${stockSymbol}`);
        return await this.chat.streamMessage(`Please provide the historical performance data for the stock ${stockSymbol}. Include data for at least the past five years.`);
    }

    async handleCompareCommand(command) {
        const [stockSymbol1, stockSymbol2] = command.split(' ').slice(1);
        await this.initializeAndStartConversationIfNeeded(command, `Compare ${stockSymbol1} and ${stockSymbol2}`);
        return await this.chat.streamMessage(`Please compare the financial metrics of the stocks ${stockSymbol1} and ${stockSymbol2}. Include metrics like price, market cap, P/E ratio, and recent performance.`);
    }

    async handleRecommendationsCommand(command) {
        const stockSymbol = command.split(' ')[1];
        await this.initializeAndStartConversationIfNeeded(command, `Recommendations for ${stockSymbol}`);
        return await this.chat.streamMessage(`Please provide buy, hold, or sell recommendations for the stock ${stockSymbol}. Include justifications for the recommendation.`);
    }

    async handleDividendsCommand(command) {
        const stockSymbol = command.split(' ')[1];
        await this.initializeAndStartConversationIfNeeded(command, `Dividends for ${stockSymbol}`);
        return await this.chat.streamMessage(`Please provide information about the dividend history and upcoming dividends of the stock ${stockSymbol}.`);
    }

    async handleInsightsCommand(command) {
        const stockSymbol = command.split(' ')[1];
        await this.initializeAndStartConversationIfNeeded(command, `Insights for ${stockSymbol}`);
        return await this.chat.streamMessage(`Please provide insights and summaries from recent earnings calls and reports for the stock ${stockSymbol}.`);
    }

    async handleInsiderCommand(command) {
        const stockSymbol = command.split(' ')[1];
        await this.initializeAndStartConversationIfNeeded(command, `Insider trading for ${stockSymbol}`);
        return await this.chat.streamMessage(`Please show recent insider trading activities for the stock ${stockSymbol}.`);
    }

    async handleFinancialsCommand(command) {
        const stockSymbol = command.split(' ')[1];
        await this.initializeAndStartConversationIfNeeded(command, `Financials for ${stockSymbol}`);
        return await this.chat.streamMessage(`Please fetch the detailed financial statements such as income statements, balance sheets, and cash flow statements for the stock ${stockSymbol}.`);
    }

    async handlePeersCommand(command) {
        const stockSymbol = command.split(' ')[1];
        await this.initializeAndStartConversationIfNeeded(command, `Peers of ${stockSymbol}`);
        return await this.chat.streamMessage(`Please list the peer companies and competitors of the stock ${stockSymbol}.`);
    }

    async handleSentimentCommand(command) {
        const stockSymbol = command.split(' ')[1];
        await this.initializeAndStartConversationIfNeeded(command, `Sentiment for ${stockSymbol}`);
        return await this.chat.streamMessage(`Please provide a sentiment analysis for the stock ${stockSymbol} based on social media, news, and other sources.`);
    }

    async handleRiskCommand(command) {
        const stockSymbol = command.split(' ')[1];
        await this.initializeAndStartConversationIfNeeded(command, `Risk analysis for ${stockSymbol}`);
        return await this.chat.streamMessage(`Please analyze the risk factors associated with the stock ${stockSymbol}.`);
    }

    async handleEventsCommand(command) {
        const stockSymbol = command.split(' ')[1];
        await this.initializeAndStartConversationIfNeeded(command, `Upcoming events for ${stockSymbol}`);
        return await this.chat.streamMessage(`Please list upcoming events related to the stock ${stockSymbol}, such as earnings calls, shareholder meetings, etc.`);
    }

    async handleOwnershipCommand(command) {
        const stockSymbol = command.split(' ')[1];
        await this.initializeAndStartConversationIfNeeded(command, `Ownership of ${stockSymbol}`);
        return await this.chat.streamMessage(`Please provide information about major institutional and insider ownership of the stock ${stockSymbol}.`);
    }

    async handleTechnicalsCommand(command) {
        const stockSymbol = command.split(' ')[1];
        await this.initializeAndStartConversationIfNeeded(command, `Technical analysis for ${stockSymbol}`);
        return await this.chat.streamMessage(`Please provide technical analysis for the stock ${stockSymbol}, including indicators like moving averages, RSI, and MACD.`);
    }
}

module.exports = Command;