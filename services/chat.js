const MainAssistantService = require('../utils/MainAssistantService');
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

    // Initialize the assistant with the given model and name
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

    // Start a new conversation with the initial user message
    async startConversation(initialMessage) {
        this.ensureInitialized();
        const newThread = await this.createNewThread(initialMessage);
        this.threadId = newThread.id;
        this.isConversationStarted = true;
        return await this.sendMessage(initialMessage);
    }

    // Ensure the assistant is initialized
    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('Assistant not initialized. Please call initializeAssistant first.');
        }
    }

    // Create a new thread with the initial user message
    async createNewThread(initialMessage) {
        return await this.mainAssistant.createThread({
            messages: [{ role: 'user', content: initialMessage }],
            metadata: { topic: 'Chat' },
        });
    }

    // Send a message to the assistant
    async sendMessage(userMessage) {
        this.ensureConversationStarted();
        const response = await this.mainAssistant.chatWithAssistant(this.threadId, this.mainAssistant.assistantId, userMessage);
        return {
            message: response,
            logs: this.mainAssistant.getAndClearSystemLogs()
        };
    }

    // Ensure the conversation is started
    ensureConversationStarted() {
        if (!this.isInitialized || !this.isConversationStarted) {
            throw new Error('Assistant not initialized or conversation not started. Please call initializeAssistant and startConversation first.');
        }
    }

    // Recursive method to observe stream
    async observeStream(stream, onEvent) {
      this.currentStream = stream;

      stream.on('textDelta', (delta) => {
          onEvent({ type: 'textDelta', data: delta });
      });

      stream.on('toolCallCreated', (toolCall) => {
          onEvent({ type: 'toolCallCreated', data: toolCall });
      });

      stream.on('toolCallDelta', (toolCallDelta, snapshot) => {
          onEvent({ type: 'toolCallDelta', data: { delta: toolCallDelta, snapshot } });
      });

      stream.on('end', async () => {
          const currentRun = stream.currentRun();
          if (currentRun && currentRun.status === "requires_action" &&
              currentRun.required_action.type === "submit_tool_outputs") {
              const toolCalls = currentRun.required_action.submit_tool_outputs.tool_calls;
              await this.handleToolCalls(this.threadId, toolCalls, currentRun.id, onEvent);
          }
          onEvent({ type: 'end' });
      });

      stream.on('error', (err) => {
          onEvent({ type: 'error', data: err.message });
      });

      return stream.finalMessages();
  }

    // Stream messages in real-time
    async streamMessage(userMessage, onEvent) {
      console.log('[streamMessage] Starting with message:', userMessage);
      this.ensureConversationStarted();

      try {
          console.log('[streamMessage] Creating message in thread');
          await this.mainAssistant.createMessage(this.threadId, {
              role: 'user',
              content: userMessage,
          });

          const { assistantId, threadId } = this.getStreamParameters();
          const stream = await this.mainAssistant.client.beta.threads.runs.createAndStream(
              threadId,
              { assistant_id: assistantId }
          );

          await this.observeStream(stream, onEvent);

          const finalMessages = await stream.finalMessages();
          console.log('[streamMessage] Final messages:', finalMessages);

      } catch (error) {
          console.error('[streamMessage] Error:', error);
          onEvent({ type: 'error', data: error.message });
          throw error;
      }
  }

    // Get parameters for the stream
    getStreamParameters() {
        const assistantId = this.mainAssistant.assistantId;
        const threadId = this.threadId;

        if (!assistantId || !threadId) {
            console.error('[streamMessage] Missing parameter:', { assistantId, threadId });
            throw new Error('Missing required parameter.');
        }
        return { assistantId, threadId };
    }

    // Handle events during the stream
    async handleStreamEvents(stream, onEvent, threadId, assistantId) {
        let isMessageComplete = false;

        for await (const event of stream) {
            switch (event.event) {
                case 'thread.message.delta':
                    this.handleTextDelta(event, onEvent);
                    break;
                case 'thread.message.completed':
                    isMessageComplete = true;
                    onEvent({ type: 'textCreated', data: event.data });
                    break;
                case 'thread.run.requires_action':
                    await this.handleRunRequiresAction(event, onEvent, threadId);
                    break;
                case 'thread.run.completed':
                    await this.handleRunCompleted(onEvent, threadId, isMessageComplete);
                    break;
                default:
                    break;
            }
        }

        console.log('[streamMessage] Stream completed');
    }

    // Handle text delta events
    handleTextDelta(event, onEvent) {
        const deltaContent = event.data.delta.content;
        if (deltaContent && deltaContent[0] && deltaContent[0].text) {
            const textValue = deltaContent[0].text.value;
            console.log('[streamMessage] Sending textDelta:', textValue);
            onEvent({ type: 'textDelta', data: textValue });
        }
    }

    // Handle run requires action events
    async handleRunRequiresAction(chunk, onEvent, threadId) {
        console.log('[handleRunRequiresAction] Tool call required');
        const toolCalls = chunk.data.required_action.submit_tool_outputs.tool_calls;
        onEvent({ type: 'requiresAction', data: toolCalls });
        await this.handleToolCalls(threadId, toolCalls, chunk.data.id, onEvent);
    }

    // Handle run completed events
    async handleRunCompleted(onEvent, threadId, isMessageComplete) {
        console.log('[streamMessage] Run completed');
        if (!isMessageComplete) {
            const finalResponse = await this.getFinalResponse(threadId);
            if (finalResponse) {
                onEvent({ type: 'textDelta', data: finalResponse });
            }
        }
        onEvent({ type: 'end' });
    }

    // Get the final response if the message is not complete
    async getFinalResponse(threadId) {
        const messages = await this.mainAssistant.client.beta.threads.messages.list(threadId);
        const lastMessage = messages.data.find(m => m.role === 'assistant');
        return lastMessage && lastMessage.content[0].text ? lastMessage.content[0].text.value : null;
    }

    // Handle tool calls required during a run
    async handleToolCalls(threadId, toolCalls, runId, onEvent) {
      try {
          console.log('[handleToolCalls] Processing tool calls:', toolCalls);
          if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
              console.warn('No tool calls to handle');
              return;
          }

          const toolOutputs = await Promise.all(toolCalls.map(async (toolCall) => {
              console.log('[handleToolCalls] Processing tool call:', toolCall);
              onEvent({ 
                  type: 'toolCallCreated', 
                  data: {
                      id: toolCall.id,
                      function: {
                          name: toolCall.function.name,
                          arguments: toolCall.function.arguments
                      }
                  }
              });
              const result = await this.mainAssistant.executeToolCall(toolCall);
              onEvent({ 
                  type: 'toolCallCompleted', 
                  data: {
                      id: toolCall.id,
                      function: {
                          name: toolCall.function.name,
                          arguments: toolCall.function.arguments
                      },
                      output: result
                  }
              });
              return {
                  tool_call_id: toolCall.id,
                  output: JSON.stringify(result),
              };
          }));

          console.log('[handleToolCalls] Submitting tool outputs and starting stream');
          const stream = await this.mainAssistant.client.beta.threads.runs.submitToolOutputsStream(
              threadId,
              runId,
              { tool_outputs: toolOutputs }
          );

          await this.observeStream(stream, onEvent);

      } catch (error) {
          console.error('[handleToolCalls] Error handling tool calls:', error);
          onEvent({ type: 'error', data: error.message });
      }
  }

    async waitForRunCompletion(threadId, runId) {
      let run;
      do {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before checking again
          run = await this.mainAssistant.client.beta.threads.runs.retrieve(threadId, runId);
          console.log(`[waitForRunCompletion] Run status: ${run.status}`);
      } while (run.status === 'in_progress');

      if (run.status === 'completed') {
          console.log('[waitForRunCompletion] Run completed successfully');
      } else {
          console.error(`[waitForRunCompletion] Run failed with status: ${run.status}`);
      }
  }

  // End the current conversation
  async endConversation() {
      if (this.mainAssistant) {
          await this.mainAssistant.deleteAllAssistants();
          this.resetConversationState();
      }
      return this.mainAssistant ? this.mainAssistant.getAndClearSystemLogs() : [];
  }

  // Reset the conversation state
  resetConversationState() {
      this.mainAssistant = null;
      this.threadId = null;
      this.isInitialized = false;
      this.isConversationStarted = false;
  }
}

module.exports = Chat;