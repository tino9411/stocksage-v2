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
      let fullResponse = ''; // Define fullResponse here

      // Log initialization state
      console.log('[streamMessage] Initialization State: ', {
        isInitialized: this.isInitialized,
        isConversationStarted: this.isConversationStarted,
        assistantId: this.mainAssistant.assistantId,
        threadId: this.threadId,
      });

      console.log('[streamMessage] Creating message in thread');
      await this.mainAssistant.createMessage(this.threadId, {
        role: 'user',
        content: userMessage,
      });

      // Validate assistant_id before streaming
      const assistantId = this.mainAssistant.assistantId;
      const threadId = this.threadId;

      if (!assistantId || !threadId) {
        console.error('[streamMessage] Missing parameter:', { assistantId, threadId });
        throw new Error('Missing required parameter.');
      }

      console.log('[streamMessage] Parameters for streaming:', { assistantId, threadId });

      console.log('[streamMessage] Starting stream');
      const stream = await this.mainAssistant.client.beta.threads.runs.createAndStream(threadId, { assistant_id: assistantId });

      console.log('[streamMessage] Stream object created', stream);

      for await (const event of stream) {
        //console.log('[streamMessage] Event received:', event);
        if (event.event === 'thread.message.delta') {
          const deltaContent = event.data.delta.content;
          if (deltaContent && deltaContent[0] && deltaContent[0].text) {
            const textValue = deltaContent[0].text.value;
            fullResponse += textValue;
            console.log('[/stream] Sending textDelta:', textValue);
            onEvent({ type: 'textDelta', data: textValue });
          }
        } else if (event.event === 'thread.message.completed') {
          //console.log('[streamMessage] textCreated event:', event.data);
          onEvent({ type: 'textCreated', data: event.data });
        } else if (event.event === 'thread.run.step.delta') {
          //console.log('[streamMessage] toolCallDelta event:', event.data);
          onEvent({ type: 'toolCallDelta', data: event.data });
        } else if (event.event === 'error') {
          //console.log('[streamMessage] error event:', event.data);
          onEvent({ type: 'error', data: event.data });
          throw new Error(event.data);
        } else if (event.event === 'thread.run.step.completed') {
          //console.log('[streamMessage] end event');
          onEvent({ type: 'end' });
          break;
        }
      }

      console.log('[streamMessage] Stream completed');
      return {
        fullResponse, // Return fullResponse here
        logs: this.mainAssistant.getAndClearSystemLogs()
      };
    } catch (error) {
      console.error('[streamMessage] Error:', error);
      onEvent({ type: 'error', data: error.message });
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