//routes/chat.js
const express = require('express');
const router = express.Router();
const Chat = require('../services/chat');
require('dotenv').config();

const chat = new Chat(process.env.OPENAI_API_KEY);

function processAssistantResponse(text) {
    // Replace single backticks with a special marker
    let processed = text.replace(/`([^`\n]+)`/g, '§§§$1§§§');
    
    // Replace triple backticks with a different marker
    processed = processed.replace(/```([\s\S]*?)```/g, '£££$1£££');
    
    // Now replace the markers with proper Markdown syntax
    processed = processed.replace(/§§§/g, '`');
    processed = processed.replace(/£££/g, '```');
    
    return processed;
  }

router.post('/initialize', async (req, res) => {
    try {
        await chat.initializeAssistant({
            model: "gpt-4o-mini",
            name: "Stock Analysis Assistant",
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

Use the provided tools to fetch, analyze data and tell the user what you have found.
If the user makes a specific request for data you must provide it in your response. 
Always provide clear explanations and justify your analysis.
Be conversational and engaging in your responses. Remember the context of the ongoing conversation.

When formatting your response, YOU MUST follow these guidelines:
1. You MUST use Markdown syntax for formatting.
2. You MUST use headings (# for main sections, ## for subsections) to organize your report.
3. You MUST use bullet points or numbered lists for listing items.
4. You MUST use tables for presenting structured data. Format tables as follows:
   | Column 1 | Column 2 | Column 3 |
   |----------|----------|----------|
   | Data 1   | Data 2   | Data 3   |
5. You MUST use bold text for important information or key metrics.
6. You MUST use code blocks for any numerical calculations or formulas.
7. You MUST keep paragraphs concise for better readability in the chat interface.

Example structure:
# Stock Analysis: [Stock Symbol]

## Basic Information
- **Price**: $XX.XX
- **Volume**: XX,XXX,XXX
- **Market Cap**: $XX.XX Billion

## Fundamental Analysis
[Your analysis here]

## Technical Indicators
| Indicator | Value | Interpretation |
|-----------|-------|----------------|
| 50-day MA | $XX.XX| [Interpretation] |
| RSI       | XX    | [Interpretation] |
| MACD      | X.XX  | [Interpretation] |

[Continue with other sections...]

## Summary and Recommendation
[Your summary and recommendation here]

Remember to adjust your language and detail level based on the user's questions and the ongoing conversation.`,
        });
        res.json({ message: "Assistant initialized successfully" });
    } catch (error) {
        console.error('Error initializing assistant:', error);
        res.status(500).json({ error: "Failed to initialize assistant" });
    }
});

router.post('/start', async (req, res) => {
    try {
      const { message } = req.body;
      const response = await chat.startConversation(message);
      const processedResponse = processAssistantResponse(response);
      res.json({ message: processedResponse });
    } catch (error) {
      console.error('Error starting conversation:', error);
      res.status(500).json({ error: "Failed to start conversation" });
    }
  });
  
  router.post('/message', async (req, res) => {
    try {
      const { message } = req.body;
      const response = await chat.sendMessage(message);
      const processedResponse = processAssistantResponse(response);
      res.json({ message: processedResponse });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

router.post('/end', async (req, res) => {
    try {
        await chat.endConversation();
        res.json({ message: "Conversation ended successfully" });
    } catch (error) {
        console.error('Error ending conversation:', error);
        res.status(500).json({ error: "Failed to end conversation" });
    }
});

module.exports = router;