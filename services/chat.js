const MainAssistantService = require('../utils/MainAssistantService');
const OpenAI = require('openai');

class Chat {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.mainAssistant = null;
        this.threadId = null;
        this.isInitialized = false;
        this.isConversationStarted = false;
    }

    async initializeAssistant({ model, name }) {
        try {
            this.mainAssistant = new MainAssistantService(this.apiKey);
            await this.mainAssistant.initialize({ model, name });
            this.isInitialized = true;
            return this.mainAssistant.getAndClearSystemLogs();
        } catch (error) {
            console.error('Failed to initialize assistant:', error);
            this.isInitialized = false;
            throw error;
        }
    }

    async startConversation(initialMessage) {
      if (!this.isInitialized) {
        throw new Error('Assistant not initialized. Please call initializeAssistant first.');
      }
      const newThread = await this.mainAssistant.createThread({
        messages: [{ role: 'user', content: initialMessage }],
        metadata: { topic: 'Chat' },
      });
      this.threadId = newThread.id;
      this.isConversationStarted = true;
      return await this.sendMessage(initialMessage);
    }
  
    async sendMessage(userMessage) {
      if (!this.isInitialized || !this.isConversationStarted) {
        throw new Error('Assistant not initialized or conversation not started. Please call initializeAssistant and startConversation first.');
      }
      const response = await this.mainAssistant.chatWithAssistant(this.threadId, this.mainAssistant.assistantId, userMessage);
      return {
        message: response,
        logs: this.mainAssistant.getAndClearSystemLogs()
      };
    }

    async streamMessage(userMessage, onEvent) {
      console.log('[streamMessage] Starting with message:', userMessage);
    
      if (!this.isInitialized || !this.isConversationStarted) {
        console.log('[streamMessage] Error: Assistant not initialized or conversation not started');
        throw new Error('Assistant not initialized or conversation not started. Please call initializeAssistant and startConversation first.');
      }
    
      try {
        console.log('[streamMessage] Creating message in thread');
        await this.mainAssistant.createMessage(this.threadId, {
          role: 'user',
          content: userMessage,
        });
    
        const assistantId = this.mainAssistant.assistantId;
        const threadId = this.threadId;
    
        if (!assistantId || !threadId) {
          console.error('[streamMessage] Missing parameter:', { assistantId, threadId });
          throw new Error('Missing required parameter.');
        }
    
        console.log('[streamMessage] Starting stream');
        const stream = await this.mainAssistant.client.beta.threads.runs.createAndStream(threadId, { assistant_id: assistantId });
    
        let isMessageComplete = false;
    
        for await (const event of stream) {
          if (event.event === 'thread.message.delta') {
            const deltaContent = event.data.delta.content;
            if (deltaContent && deltaContent[0] && deltaContent[0].text) {
              const textValue = deltaContent[0].text.value;
              console.log('[streamMessage] Sending textDelta:', textValue);
              onEvent({ type: 'textDelta', data: textValue });
            }
          } else if (event.event === 'thread.message.completed') {
            isMessageComplete = true;
            onEvent({ type: 'textCreated', data: event.data });
          } else if (event.event === 'thread.run.requires_action') {
            console.log('[streamMessage] Tool call required');
            const toolCalls = event.data.required_action.submit_tool_outputs.tool_calls;
            onEvent({ type: 'requiresAction', data: toolCalls });
            await this.handleToolCalls(threadId, toolCalls, event.data.id);
          } else if (event.event === 'thread.run.completed') {
            console.log('[streamMessage] Run completed');
            if (!isMessageComplete) {
              const messages = await this.mainAssistant.client.beta.threads.messages.list(threadId);
              const lastMessage = messages.data.find(m => m.role === 'assistant');
              if (lastMessage && lastMessage.content[0].text) {
                const finalResponse = lastMessage.content[0].text.value;
                onEvent({ type: 'textDelta', data: finalResponse });
              }
            }
            onEvent({ type: 'end' });
            break;
          }
        }
    
        console.log('[streamMessage] Stream completed');
      } catch (error) {
        console.error('[streamMessage] Error:', error);
        onEvent({ type: 'error', data: error.message });
        throw error;
      }
    }
    
    async handleToolCalls(threadId, toolCalls, runId) {
      try {
        console.log('[handleToolCalls] Processing tool calls');
        if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
          console.warn('No tool calls to handle');
          return;
        }
    
        const toolOutputs = await Promise.all(toolCalls.map(async (toolCall) => {
          const result = await this.mainAssistant.executeToolCall(toolCall);
          return {
            tool_call_id: toolCall.id,
            output: JSON.stringify(result),
          };
        }));
    
        console.log('[handleToolCalls] Submitting tool outputs');
        await this.mainAssistant.client.beta.threads.runs.submitToolOutputs(
          threadId,
          runId,
          { tool_outputs: toolOutputs }
        );
        console.log('[handleToolCalls] Tool outputs submitted successfully');
      } catch (error) {
        console.error('[handleToolCalls] Error handling tool calls:', error);
        throw error;
      }
    }
    
    async endConversation() {
        if (this.mainAssistant) {
            await this.mainAssistant.deleteAllAssistants();
            this.mainAssistant = null;
            this.threadId = null;
            this.isInitialized = false;
            this.isConversationStarted = false;
        }
        return this.mainAssistant ? this.mainAssistant.getAndClearSystemLogs() : [];
    }
}

module.exports = Chat;