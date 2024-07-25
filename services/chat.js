const AssistantService = require('../utils/assistantService');

class Chat {
    constructor(apiKey) {
      this.assistantService = new AssistantService(apiKey);
      this.assistantId = null;
      this.threadId = null;
    }
  
    async initializeAssistant({ model, name, instructions, tools }) {
      console.log('Initializing assistant...');
      const availableTools = this.assistantService.getAvailableTools();
      const newAssistant = await this.assistantService.createAssistant({
        model,
        name,
        instructions,
        tools: tools || availableTools,
      });
      this.assistantId = newAssistant.id;
      console.log('Created Assistant:', newAssistant);
    }
  
    async startConversation(initialMessage) {
      console.log('Starting conversation...');
      if (!this.assistantId) {
        throw new Error('Assistant not initialized. Please call initializeAssistant first.');
      }
      const newThread = await this.assistantService.createThread({
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
      if (!this.threadId || !this.assistantId) {
        throw new Error('Assistant or thread not initialized. Please call initializeAssistant and startConversation first.');
      }
      try {
        const response = await this.assistantService.chatWithAssistant(this.threadId, this.assistantId, userMessage);
        return response;
      } catch (error) {
        console.error('Error in sendMessage:', error);
        throw error;
      }
    }

    async endConversation() {
        console.log('Ending conversation...');
        if (this.threadId) {
            const deleteThreadResponse = await this.assistantService.deleteThread(this.threadId);
            console.log('Deleted Thread:', deleteThreadResponse);
            this.threadId = null;
        }
        if (this.assistantId) {
            const deleteAssistantResponse = await this.assistantService.deleteAssistant(this.assistantId);
            console.log('Deleted Assistant:', deleteAssistantResponse);
            this.assistantId = null;
        }
    }
}

module.exports = Chat;