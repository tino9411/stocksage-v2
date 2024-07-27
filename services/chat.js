//services/chat.js
const MainAssistantService = require('../utils/MainAssistantService');

class Chat {
  constructor(apiKey) {
      this.mainAssistant = new MainAssistantService(apiKey);
      this.threadId = null;
  }

  async initializeAssistant({ model, name }) {
      console.log('Initializing main assistant...');

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
        console.log('Ending conversation...');
        if (this.threadId) {
            const deleteThreadResponse = await this.mainAssistant.deleteThread(this.threadId);
            console.log('Deleted Thread:', deleteThreadResponse);
            this.threadId = null;
        }
        console.log('Conversation ended');
    }
}

module.exports = Chat;