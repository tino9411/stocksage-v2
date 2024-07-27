const MainAssistantService = require('../utils/MainAssistantService');
const OpenAI = require('openai');

class Chat {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.mainAssistant = null;
    this.threadId = null;
  }

  async initializeAssistant({ model, name }) {
    this.mainAssistant = new MainAssistantService(this.apiKey);
    await this.mainAssistant.initialize({ model, name });
    return this.mainAssistant.getAndClearSystemLogs();
  }

  async startConversation(initialMessage) {
    if (!this.mainAssistant || !this.mainAssistant.assistantId) {
      throw new Error('Assistant not initialized. Please call initializeAssistant first.');
    }
    const newThread = await this.mainAssistant.createThread({
      messages: [{ role: 'user', content: initialMessage }],
      metadata: { topic: 'Chat' },
    });
    this.threadId = newThread.id;
    return await this.sendMessage(initialMessage);
  }

  async sendMessage(userMessage) {
    if (!this.threadId || !this.mainAssistant.assistantId) {
      throw new Error('Assistant or thread not initialized. Please call initializeAssistant and startConversation first.');
    }
    const response = await this.mainAssistant.chatWithAssistant(this.threadId, this.mainAssistant.assistantId, userMessage);
    return {
      message: response,
      logs: this.mainAssistant.getAndClearSystemLogs()
    };
  }

  async endConversation() {
    if (this.mainAssistant) {
      await this.mainAssistant.deleteAllAssistants();
      // Also delete threads if necessary
      this.mainAssistant = null;
      this.threadId = null;
    }
    return this.mainAssistant ? this.mainAssistant.getAndClearSystemLogs() : [];
  }
}

module.exports = Chat;