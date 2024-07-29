//utils/BaseAssistantService.js
const OpenAI = require('openai');
const connectDB = require('../config/db');
const { EventEmitter } = require('events');

class BaseAssistantService extends EventEmitter {
    constructor(apiKey) {
        super();
        this.apiKey = apiKey;
        this.client = new OpenAI({
            apiKey: this.apiKey,
        });
        this.dbConnected = false;
        this.logs = [];
        this.systemLogs = [];
    }

    addSystemLog(log) {
        const formattedLog = `[${new Date().toISOString()}] ${log}`;
        this.systemLogs.push(formattedLog);
        console.log(formattedLog); // Keep console logging for server-side visibility
      }

    getSystemLogs() {
        return this.systemLogs;
      }
    
    clearSystemLogs() {
        this.systemLogs = [];
      }

    addLog(log) {
        this.logs.push(log);
        console.log(log); // Still log to console for server-side visibility
    }

    getLogs() {
        return this.logs;
    }


    async ensureDBConnection() {
        if (!this.dbConnected) {
            await connectDB();
            this.dbConnected = true;
        }
    }

    async createAssistant({ model, name = null, description = null, instructions = null, tools = [], metadata = {}, temperature = 1.0, top_p = 1.0, response_format = 'auto' }) {
        try {
            const assistant = await this.client.beta.assistants.create({
                model,
                name,
                description,
                instructions,
                tools,
                metadata,
                temperature,
                top_p,
                response_format,
            });
            console.log('Created Assistant:', JSON.stringify(assistant, null, 2));
            return assistant;
        } catch (error) {
            console.error('Error creating assistant:', error);
            throw error;
        }
    }

    async listAssistants({ limit = 20, order = 'desc', after = null, before = null }) {
        try {
            const assistants = await this.client.beta.assistants.list({
                limit,
                order,
                after,
                before,
            });
            return assistants.data;
        } catch (error) {
            console.error('Error listing assistants:', error);
            throw error;
        }
    }

    async retrieveAssistant(assistant_id) {
        try {
            const assistant = await this.client.beta.assistants.retrieve(assistant_id);
            return assistant;
        } catch (error) {
            console.error('Error retrieving assistant:', error);
            throw error;
        }
    }

    async modifyAssistant(assistant_id, { model, name = null, description = null, instructions = null, tools = [], metadata = {}, temperature = 1.0, top_p = 1.0, response_format = 'auto' }) {
        try {
            const updatedAssistant = await this.client.beta.assistants.update(assistant_id, {
                model,
                name,
                description,
                instructions,
                tools,
                metadata,
                temperature,
                top_p,
                response_format,
            });
            return updatedAssistant;
        } catch (error) {
            console.error('Error modifying assistant:', error);
            throw error;
        }
    }

    async deleteAssistant(assistant_id) {
        try {
            const response = await this.client.beta.assistants.del(assistant_id);
            return response;
        } catch (error) {
            console.error('Error deleting assistant:', error);
            throw error;
        }
    }

    async createThread({ messages = [], tool_resources = null, metadata = {} }) {
        try {
            const threadOptions = {
                tool_resources,
                metadata,
            };
            
            if (messages.length > 0) {
                threadOptions.messages = messages;
            }
    
            const thread = await this.client.beta.threads.create(threadOptions);
            return thread;
        } catch (error) {
            console.error('Error creating thread:', error);
            throw error;
        }
    }

    async retrieveThread(thread_id) {
        try {
            const thread = await this.client.beta.threads.retrieve(thread_id);
            return thread;
        } catch (error) {
            console.error('Error retrieving thread:', error);
            throw error;
        }
    }

    async modifyThread(thread_id, { tool_resources = null, metadata = {} }) {
        try {
            const updatedThread = await this.client.beta.threads.update(thread_id, {
                tool_resources,
                metadata,
            });
            return updatedThread;
        } catch (error) {
            console.error('Error modifying thread:', error);
            throw error;
        }
    }

    async deleteThread(thread_id) {
        try {
            const response = await this.client.beta.threads.del(thread_id);
            return response;
        } catch (error) {
            console.error('Error deleting thread:', error);
            throw error;
        }
    }

    async createMessage(thread_id, { role, content, attachments = [], metadata = {} }) {
        try {
            const message = await this.client.beta.threads.messages.create(thread_id, {
                role,
                content,
                attachments,
                metadata,
            });
            return message;
        } catch (error) {
            console.error('Error creating message:', error);
            throw error;
        }
    }

    async listMessages(thread_id, options = {}) {
        try {
            const { limit = 20, order = 'desc', after = null, before = null } = options;
            const messages = await this.client.beta.threads.messages.list(thread_id, {
                limit,
                order,
                after,
                before,
            });
            return messages.data;
        } catch (error) {
            console.error('Error listing messages:', error);
            throw error;
        }
    }

    async retrieveMessage(thread_id, message_id) {
        try {
            const message = await this.client.beta.threads.messages.retrieve(thread_id, message_id);
            return message;
        } catch (error) {
            console.error('Error retrieving message:', error);
            throw error;
        }
    }

    async modifyMessage(thread_id, message_id, { metadata = {} }) {
        try {
            const updatedMessage = await this.client.beta.threads.messages.update(thread_id, message_id, {
                metadata,
            });
            return updatedMessage;
        } catch (error) {
            console.error('Error modifying message:', error);
            throw error;
        }
    }

    async deleteMessage(thread_id, message_id) {
        try {
            const response = await this.client.beta.threads.messages.del(thread_id, message_id);
            return response;
        } catch (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    }

    async processMessage(message, thread_id) {
        // This method should be implemented by each sub-assistant
        throw new Error('processMessage must be implemented by subclass');
    }

    async handleRunStatus(thread_id, run, stream) {
        this.addSystemLog(`Handling run status: ${run ? run.status : 'undefined'}`);
        if (stream) {
            return this.handleRunStatusStream(thread_id, run, this.assistantId);
        }
        while (run) {
            switch (run.status) {
                case 'queued':
                case 'in_progress':
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    run = await this.client.beta.threads.runs.retrieve(thread_id, run.id);
                    this.addSystemLog(`Run status updated: ${run.status}`);
                    break;
                case 'requires_action':
                    run = await this.handleRequiresAction(thread_id, run);
                    break;
                case 'completed':
                    this.addSystemLog('Run completed. Retrieving messages...');
                    const steps = await this.getRunSteps(thread_id, run.id);
                    this.logRunSteps(steps);
                    const messages = await this.listMessages(thread_id);
                    const assistantMessages = messages.filter(message => message.role === 'assistant');
                    if (assistantMessages.length > 0) {
                        const latestMessage = assistantMessages[0].content[0].text.value;
                        this.addSystemLog('Assistant response received');
                        return latestMessage;
                    } else {
                        this.addSystemLog('No assistant messages found');
                        return null;
                    }
                case 'failed':
                case 'cancelled':
                case 'expired':
                    this.addSystemLog(`Run ended with status: ${run.status}`);
                    return null;
                default:
                    this.addSystemLog(`Unknown run status: ${run.status}`);
                    return null;
            }
        }
        this.addSystemLog('Run object is undefined');
        return null;
    }

    async handleRunStatusStream(thread_id, run_id) {
        console.log(`\x1b[34m[Handling stream]\x1b[Assistant ID]: ${this.assistantId}, Thread: ${thread_id}`);
        try {
            const stream = await this.client.beta.threads.runs.stream({
                thread_id: thread_id,
                run_id: run_id,
                assistant_id: this.assistantId
            });

      
          stream.on('event', (event) => this.emit('event', event));
          stream.on('runStepCreated', (runStep) => this.emit('runStepCreated', runStep));
          stream.on('runStepDelta', (delta, snapshot) => this.emit('runStepDelta', delta, snapshot));
          stream.on('runStepDone', (runStep) => this.emit('runStepDone', runStep));
          stream.on('messageCreated', (message) => this.emit('messageCreated', message));
          stream.on('messageDelta', (delta, snapshot) => this.emit('messageDelta', delta, snapshot));
          stream.on('messageDone', (message) => this.emit('messageDone', message));
          stream.on('textCreated', (content) => this.emit('textCreated', content));
          stream.on('textDelta', (delta, snapshot) => this.emit('textDelta', delta, snapshot));
          stream.on('textDone', (content, snapshot) => this.emit('textDone', content, snapshot));
          stream.on('toolCallCreated', (toolCall) => this.emit('toolCallCreated', toolCall));
          stream.on('toolCallDelta', (delta, snapshot) => this.emit('toolCallDelta', delta, snapshot));
          stream.on('toolCallDone', (toolCall) => this.emit('toolCallDone', toolCall));
          stream.on('end', () => this.emit('end'));
      
          for await (const event of stream) {
            switch (event.type) {
              case 'run_step':
                if (event.data.status === 'in_progress') {
                  this.emit('runStepInProgress', event.data);
                } else if (event.data.status === 'completed') {
                  this.emit('runStepCompleted', event.data);
                }
                break;
              case 'message':
                if (event.data.role === 'assistant') {
                  this.emit('assistantMessage', event.data);
                }
                break;
              case 'content':
                if (event.data.type === 'text') {
                  this.emit('textContent', event.data.text);
                }
                break;
              case 'tool_call':
                this.emit('toolCall', event.data);
                break;
              // Add more cases if needed for other event types
            }
          }
      
          return await stream.finalMessages();
        } catch (error) {
          console.error('Error in base assistant stream:', error);
          this.emit('error', error);
          throw error;
        }
      }

    async handleRequiresAction(thread_id, run) {
        // This method should be implemented by subclasses
        throw new Error('handleRequiresAction must be implemented by subclass');
    }

    async chatWithAssistant(thread_id, assistant_id, userMessage, stream = false) {
        console.log(`\x1b[34m[Chat Started]\x1b[0m Assistant: ${assistant_id}, Thread: ${thread_id}`);
        console.log(`\x1b[34m[Chat Started]\x1b[0m User: ${assistant_id}, Message: ${userMessage}`);
        try {
            await this.createMessage(thread_id, {
                role: 'user',
                content: userMessage,
            });
    
            let run = await this.client.beta.threads.runs.create(thread_id, {
                assistant_id,
                instructions: "Please respond to the user's message.",
            });
    
            console.log(`\x1b[34m[Run Created]\x1b[0m Run ID: ${run.id}`);
    
            if (stream) {
                return this.handleRunStatusStream(thread_id, run, assistant_id);
            } else {
                const response = await this.handleRunStatus(thread_id, run, false);
                if (response) {
                    console.log('\x1b[32m[Assistant Responded]\x1b[0m');
                    return response;
                } else {
                    console.log('\x1b[31m[No Response]\x1b[0m');
                    return null;
                }
            }
        } catch (error) {
            console.error('\x1b[31m[Error]\x1b[0m', error);
            throw error;
        }
    }


    async getRunSteps(thread_id, run_id) {
        try {
            const steps = await this.client.beta.threads.runs.steps.list(thread_id, run_id);
            return steps.data;
        } catch (error) {
            console.error('Error retrieving run steps:', error);
            return [];
        }
    }

    
    logRunSteps(steps) {
        this.addSystemLog('Run Steps:');
        steps.forEach((step, index) => {
          this.addSystemLog(`Step ${index + 1}: ${step.type} - ${step.status}`);
          if (step.step_details && step.step_details.tool_calls) {
            step.step_details.tool_calls.forEach(call => {
              this.addSystemLog(`Tool: ${call.type}`);
              if (call.function) {
                this.addSystemLog(`Function: ${call.function.name}`);
                this.addSystemLog(`Arguments: ${call.function.arguments}`);
              }
            });
          }
        });
      }
    }
    
    module.exports = BaseAssistantService;