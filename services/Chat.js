const MainAssistantService = require('../assistants/MainAssistantService');
const OpenAI = require('openai');
const EventEmitter = require('events');

class Chat extends EventEmitter {
  constructor(apiKey) {
      super();
      this.apiKey = apiKey;
      this.mainAssistant = null;
      this.threadId = null;
      this.isInitialized = false;
      this.isConversationStarted = false;
      this.currentStream = null;
  }

  async initializeAssistant({ model, name, files = [] }) {
    if (!this.isInitialized) {
        try {
            this.mainAssistant = new MainAssistantService(this.apiKey);
            await this.mainAssistant.initialize({ model, name });
            
            if (files.length > 0) {
                const fileIds = await Promise.all(files.map(file => this.uploadFile(file)));
                const vectorStoreId = await this.createVectorStore("InitialVectorStore", fileIds);
                await this.attachVectorStoreToAssistant(vectorStoreId);
            }
            
            this.isInitialized = true;
            return this.mainAssistant.getAndClearSystemLogs();
        } catch (error) {
            console.error('Failed to initialize assistant:', error);
            this.isInitialized = false;
            throw error;
        }
    }
}

  async startConversation(initialMessage) {
      this.ensureInitialized();
      if (!this.isConversationStarted) {
          const newThread = await this.createNewThread(initialMessage);
          this.threadId = newThread.id;
          this.isConversationStarted = true;
          return await this.sendMessage(initialMessage);
      }
  }

  ensureInitialized() {
      if (!this.isInitialized) {
          throw new Error('Assistant not initialized. Please call initializeAssistant first.');
      }
  }

  ensureConversationStarted() {
      if (!this.isInitialized || !this.isConversationStarted) {
          throw new Error('Assistant not initialized or conversation not started. Please call initializeAssistant and startConversation first.');
      }
  }

  async createNewThread(initialMessage) {
      return await this.mainAssistant.createThread({
          messages: [{ role: 'user', content: initialMessage }],
          metadata: { topic: 'Chat' },
      });
  }

  async sendMessage(userMessage) {
      this.ensureConversationStarted();
      const response = await this.mainAssistant.chatWithAssistant(this.threadId, this.mainAssistant.assistantId, userMessage);
      return {
          message: response,
          logs: this.mainAssistant.getAndClearSystemLogs()
      };
  }

  async streamMessage(userMessage, onEvent) {
      this.ensureConversationStarted();
      try {
          await this.mainAssistant.createMessage(this.threadId, { role: 'user', content: userMessage });
          const { assistantId, threadId } = this.getStreamParameters();
          const stream = await this.mainAssistant.client.beta.threads.runs.createAndStream(threadId, { assistant_id: assistantId });
          await this.observeStream(stream, onEvent);
          const finalMessages = await stream.finalMessages();
          console.log('[streamMessage] Final messages:', finalMessages);
      } catch (error) {
          console.error('[streamMessage] Error:', error);
          onEvent({ type: 'error', data: error.message });
          throw error;
      }
  }

  getStreamParameters() {
      const assistantId = this.mainAssistant.assistantId;
      const threadId = this.threadId;
      if (!assistantId || !threadId) {
          console.error('[streamMessage] Missing parameter:', { assistantId, threadId });
          throw new Error('Missing required parameter.');
      }
      return { assistantId, threadId };
  }

  async observeStream(stream, onEvent) {
      this.currentStream = stream;
      stream.on('textDelta', (delta) => onEvent({ type: 'textDelta', data: delta }));
      stream.on('toolCallCreated', (toolCall) => onEvent({ type: 'toolCallCreated', data: toolCall }));
      stream.on('toolCallDelta', (toolCallDelta, snapshot) => onEvent({ type: 'toolCallDelta', data: { delta: toolCallDelta, snapshot } }));
      stream.on('end', async () => {
          const currentRun = stream.currentRun();
          if (currentRun && currentRun.status === "requires_action" && currentRun.required_action.type === "submit_tool_outputs") {
              const toolCalls = currentRun.required_action.submit_tool_outputs.tool_calls;
              await this.handleToolCalls(this.threadId, toolCalls, currentRun.id, onEvent);
          }
          onEvent({ type: 'end' });
      });
      stream.on('error', (err) => onEvent({ type: 'error', data: err.message }));
      return stream.finalMessages();
  }

  async handleToolCalls(threadId, toolCalls, runId, onEvent) {
      try {
          const toolOutputs = await Promise.all(toolCalls.map(async (toolCall) => {
              onEvent({ type: 'toolCallCreated', data: { id: toolCall.id, function: { name: toolCall.function.name, arguments: toolCall.function.arguments } } });
              const result = await this.mainAssistant.executeToolCall(toolCall);
              onEvent({ type: 'toolCallCompleted', data: { id: toolCall.id, function: { name: toolCall.function.name, arguments: toolCall.function.arguments }, output: result } });
              return { tool_call_id: toolCall.id, output: JSON.stringify(result) };
          }));
          const stream = await this.mainAssistant.client.beta.threads.runs.submitToolOutputsStream(threadId, runId, { tool_outputs: toolOutputs });
          await this.observeStream(stream, onEvent);
      } catch (error) {
          console.error('[handleToolCalls] Error handling tool calls:', error);
          onEvent({ type: 'error', data: error.message });
      }
  }

  async uploadFile(filePath) {
    this.ensureInitialized();
    return await this.mainAssistant.uploadFile(filePath);
}

async createVectorStore(name, fileIds) {
    this.ensureInitialized();
    return await this.mainAssistant.createVectorStore(name, fileIds);
}

async attachVectorStoreToAssistant(vectorStoreId) {
    this.ensureInitialized();
    return await this.mainAssistant.attachVectorStoreToAssistant(vectorStoreId);
}

async addFileToVectorStore(vectorStoreName, filePath) {
    this.ensureInitialized();
    return await this.mainAssistant.addFileToVectorStore(vectorStoreName, filePath);
}

async addFilesToConversation(files) {
  this.ensureConversationStarted();
  const uploadedFiles = await Promise.all(files.map(file => this.mainAssistant.uploadFile(file)));
  const vectorStoreId = await this.mainAssistant.addFilesToVectorStore(this.threadId, uploadedFiles);
  return uploadedFiles.map(file => ({ id: file.id, name: file.name }));
}

  async endConversation() {
      if (this.mainAssistant) {
          await this.mainAssistant.deleteAllAssistants();
          this.resetConversationState();
      }
      return this.mainAssistant ? this.mainAssistant.getAndClearSystemLogs() : [];
  }

  resetConversationState() {
      this.mainAssistant = null;
      this.threadId = null;
      this.isInitialized = false;
      this.isConversationStarted = false;
  }
}

module.exports = Chat;