const MainAssistantService = require('../utils/MainAssistantService');
const OpenAI = require('openai');

class Chat {
    constructor(apiKey) {
        this.apiKey = apiKey; // Store the API key
        this.mainAssistant = null; // Placeholder for the main assistant instance
        this.threadId = null; // Placeholder for the thread ID
        this.isInitialized = false; // Flag to check if the assistant is initialized
        this.isConversationStarted = false; // Flag to check if a conversation has started
    }

    // Initialize the assistant with the given model and name
    async initializeAssistant({ model, name }) {
        try {
            this.mainAssistant = new MainAssistantService(this.apiKey); // Create an instance of MainAssistantService
            await this.mainAssistant.initialize({ model, name }); // Initialize the assistant
            this.isInitialized = true; // Set the initialization flag to true
            return this.mainAssistant.getAndClearSystemLogs(); // Return system logs
        } catch (error) {
            console.error('Failed to initialize assistant:', error);
            this.isInitialized = false;
            throw error; // Throw error if initialization fails
        }
    }

    // Start a new conversation with the initial user message
    async startConversation(initialMessage) {
        this.ensureInitialized();
        const newThread = await this.createNewThread(initialMessage);
        this.threadId = newThread.id; // Store the thread ID
        this.isConversationStarted = true; // Set the conversation started flag
        return await this.sendMessage(initialMessage); // Send the initial message
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
        const response = await this.mainAssistant.chatWithAssistant(this.threadId, this.mainAssistant.assistantId, userMessage); // Chat with the assistant
        return {
            message: response,
            logs: this.mainAssistant.getAndClearSystemLogs() // Return the response and system logs
        };
    }

    // Ensure the conversation is started
    ensureConversationStarted() {
        if (!this.isInitialized || !this.isConversationStarted) {
            throw new Error('Assistant not initialized or conversation not started. Please call initializeAssistant and startConversation first.');
        }
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
          const stream = await this.mainAssistant.client.beta.threads.runs.createAndStream(threadId, { assistant_id: assistantId });

          await this.handleStreamEvents(stream, onEvent, threadId, assistantId);
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
      for await (const chunk of stream) {
          console.log('[handleStreamEvents] Received chunk:', JSON.stringify(chunk));
          
          if (chunk.event === 'thread.message.delta') {
              if (chunk.data.content && chunk.data.content[0] && chunk.data.content[0].type === 'text') {
                  const contentDelta = chunk.data.content[0].text.value;
                  console.log('[handleStreamEvents] Content delta:', contentDelta);
                  onEvent({ type: 'textDelta', data: contentDelta });
              }
          } else if (chunk.event === 'thread.run.requires_action') {
              await this.handleRunRequiresAction(chunk, onEvent, threadId);
          } else if (chunk.event === 'thread.run.completed') {
              console.log('[handleStreamEvents] Run completed');
              onEvent({ type: 'end' });
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

          console.log('[handleToolCalls] Submitting tool outputs and starting stream');
          const stream = await this.mainAssistant.client.beta.threads.runs.submitToolOutputs(
              threadId,
              runId,
              { 
                  tool_outputs: toolOutputs,
                  stream: true
              }
          );

          for await (const chunk of stream) {
              console.log('[handleToolCalls] Received chunk:', JSON.stringify(chunk));
              if (chunk.event === 'thread.message.delta') {
                  if (chunk.data.content && chunk.data.content[0] && chunk.data.content[0].type === 'text') {
                      const contentDelta = chunk.data.content[0].text.value;
                      console.log('[handleToolCalls] Content delta:', contentDelta);
                      onEvent({ type: 'textDelta', data: contentDelta });
                  }
              } else if (chunk.event === 'thread.run.completed') {
                  console.log('[handleToolCalls] Run completed');
                  onEvent({ type: 'end' });
              }
          }

          console.log('[handleToolCalls] Tool call stream completed');
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