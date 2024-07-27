//services/chat.js
const MainAssistantService = require('../utils/MainAssistantService');

class Chat {
  constructor(apiKey) {
      this.mainAssistant = new MainAssistantService(apiKey);
      this.threadId = null;
  }

  async initializeAssistant({ model, name }) {
    console.log('Initializing main assistant...');
    // Recreate the MainAssistantService instance
    this.mainAssistant = new MainAssistantService(this.apiKey);
    await this.mainAssistant.initialize({
      model,
      name
    });
    console.log('Main assistant initialized');
  }

    async startConversation(initialMessage) {
        console.log('Starting conversation...');
        if (!this.mainAssistant.assistantId) {
            throw new Error('Assistant not initialized. Please call initializeAssistant first.');
        }
        const newThread = await this.mainAssistant.createThread({
            messages: [{ role: 'user', content: initialMessage }],
            metadata: { topic: 'Chat' },
        });
        this.threadId = newThread.id;
        console.log('Created Thread:', newThread);
        console.log('Sending initial message...');
        return await this.sendMessage(initialMessage);
    }

    async sendMessage(userMessage) {
        console.log('Sending message:', userMessage);
        if (!this.threadId || !this.mainAssistant.assistantId) {
            throw new Error('Assistant or thread not initialized. Please call initializeAssistant and startConversation first.');
        }
        try {
            const response = await this.mainAssistant.chatWithAssistant(this.threadId, this.mainAssistant.assistantId, userMessage);
            return response;
        } catch (error) {
            console.error('Error in sendMessage:', error);
            throw error;
        }
    }

    async endConversation() {
      if (this.mainAssistant) {
        console.log('Deleting assistants and threads...');
        await this.mainAssistant.deleteAllAssistants();
        await this.deleteAllThreads();
        this.mainAssistant = null;
        this.threadId = null;
      }
    }

    async deleteAllThreads() {
      if (this.threadId) {
        try {
          await this.client.beta.threads.del(this.threadId);
          console.log(`Thread ${this.threadId} deleted`);
        } catch (error) {
          console.error(`Error deleting thread ${this.threadId}:`, error);
        }
      }
      // Also delete sub-assistant threads
      for (const threadId of Object.values(this.mainAssistant.subAssistantThreads)) {
        try {
          await this.client.beta.threads.del(threadId);
          console.log(`Sub-assistant thread ${threadId} deleted`);
        } catch (error) {
          console.error(`Error deleting sub-assistant thread ${threadId}:`, error);
        }
      }
    }
  }

module.exports = Chat;