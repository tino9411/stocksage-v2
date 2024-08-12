import { useState, useCallback, useRef } from 'react';
import * as chatApi from '../api/chatApi';

export const useChat = (
  addLog,
  setMessages,
  setToolCalls,
  setIsToolCallInProgress,
  setPendingToolCalls,
  setIsWaitingForToolCompletion,
  uploadedFiles,
  setUploadedFiles,
  ensureThreadExists
) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef(null);
  const currentMessageRef = useRef('');
  const currentThreadIdRef = useRef(null);
  const currentToolCallRef = useRef(null);
  const seenToolCallIdsRef = useRef(new Set());

  const setupEventSource = useCallback((url) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    eventSourceRef.current = new EventSource(url);

    eventSourceRef.current.onerror = (event) => {
      console.error('EventSource failed:', event);
      handleStreamError();
    };

    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received event:', data);
      handleEventSourceMessage(data);
    };

    eventSourceRef.current.addEventListener('toolCallCreated', handleToolCallCreated);
    eventSourceRef.current.addEventListener('toolCallDelta', handleToolCallDelta);
    eventSourceRef.current.addEventListener('toolCallCompleted', handleToolCallCompleted);
    eventSourceRef.current.addEventListener('end', handleEventSourceEnd);
  }, []);

  const handleEventSourceMessage = useCallback((data) => {
    console.log('Handling event source message:', data);
    if (data.type === 'textDelta') {
      setIsToolCallInProgress(false);
      currentMessageRef.current += data.content;
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        return [
          ...prev.slice(0, -1),
          {
            ...lastMessage,
            text: currentMessageRef.current,
            isStreaming: true
          }
        ];
      });
    }
  }, [setIsToolCallInProgress, setMessages]);

  const handleToolCallCreated = useCallback((event) => {
    const data = JSON.parse(event.data);
    console.log('Tool call created:', data);
    addLog(`Tool call created: ${data.function.name}`);
    const newToolCall = {
      id: data.id,
      threadId: currentThreadIdRef.current,
      function: {
        name: data.function.name,
        arguments: data.function.arguments
      },
      output: null
    };
    setToolCalls(prev => [...prev, newToolCall]);
    setIsToolCallInProgress(true);
    setPendingToolCalls(prev => prev + 1);
  }, [addLog, setToolCalls, setIsToolCallInProgress, setPendingToolCalls]);

  const handleToolCallDelta = useCallback((event) => {
    const data = JSON.parse(event.data);
    console.log('Tool call delta:', data);
    if (data.delta.function && data.delta.function.arguments) {
      setToolCalls(prev => prev.map(call =>
        call.id === data.id ? { 
          ...call, 
          function: { 
            ...call.function, 
            arguments: call.function.arguments + data.delta.function.arguments 
          } 
        } : call
      ));
    }
  }, [setToolCalls]);

  const handleToolCallCompleted = useCallback((event) => {
    const data = JSON.parse(event.data);
    console.log('Tool call completed:', data);
    addLog(`Tool call completed: ${data.id}`);
    setToolCalls(prev => prev.map(call =>
      call.id === data.id ? { 
        ...call, 
        output: JSON.stringify(data.output) 
      } : call
    ));
    setPendingToolCalls(prev => {
      const newValue = Math.max(0, prev - 1);
      if (newValue === 0) {
        setIsToolCallInProgress(false);
      }
      return newValue;
    });
  }, [addLog, setToolCalls, setPendingToolCalls, setIsToolCallInProgress]);

  const handleEventSourceEnd = useCallback(() => {
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      return [
        ...prev.slice(0, -1),
        { ...lastMessage, text: currentMessageRef.current, isStreaming: false }
      ];
    });
    finalizeMessage();
    closeEventSource();
  }, [setMessages]);

  const handleStreamError = useCallback(() => {
    setIsStreaming(false);
    closeEventSource();
  }, []);

  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const finalizeMessage = useCallback(() => {
    setIsStreaming(false);
    closeEventSource();

    setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        return [
            ...prev.slice(0, -1),
            {
                ...lastMessage,
                text: currentMessageRef.current,
                isStreaming: false,
            }
        ];
    });
    
    setPendingToolCalls(0);
    setIsToolCallInProgress(false);
  }, [setMessages, closeEventSource, setIsStreaming, setPendingToolCalls, setIsToolCallInProgress]);

  const sendMessage = useCallback(async (input) => {
    if (input.trim() || uploadedFiles.length > 0) {
        let threadId;
        
        try {
            threadId = await ensureThreadExists();
            currentThreadIdRef.current = threadId;
            addLog(`Using thread: ${threadId}`);
        } catch (error) {
            console.error('Error ensuring thread exists:', error);
            addLog(`Error ensuring thread exists: ${error.message}`);
            setMessages(prev => [
                ...prev, 
                { 
                    id: Date.now(), 
                    text: `Error: Failed to create or switch to a thread. Please try again.`, 
                    sender: 'assistant',
                    threadId: null
                }
            ]);
            return;
        }

        currentMessageRef.current = '';

        const newMessages = [];
        
        if (uploadedFiles.length > 0) {
            newMessages.push({
                id: Date.now(),
                type: 'files',
                files: uploadedFiles,
                sender: 'user',
                threadId: threadId
            });
        }
        
        if (input.trim()) {
            newMessages.push({
                id: Date.now() + 1,
                text: input,
                sender: 'user',
                threadId: threadId
            });
        }
        
        newMessages.push({
            id: Date.now() + 2,
            text: '',
            sender: 'assistant',
            isStreaming: true,
            threadId: threadId
        });

        setMessages(prev => [...prev, ...newMessages]);
        addLog(`Sending message: ${input}`);

        try {
            setIsStreaming(true);
            setToolCalls([]);
            setIsToolCallInProgress(false);
            setPendingToolCalls(0);
            setIsWaitingForToolCompletion(false);

            console.log('Sending message to API:', input);
            const response = await chatApi.sendMessage(threadId, input);
            console.log('API response:', response);

            if (!response) {
                throw new Error('No response received from the server');
            }
            if (!response.message || response.message !== 'Message received') {
                throw new Error(`Unexpected response from server: ${JSON.stringify(response)}`);
            }

            setupEventSource('/api/chat/stream');
        } catch (error) {
            console.error('Detailed error in sendMessage:', error);
            setMessages(prev => [
                ...prev, 
                { 
                    id: Date.now(), 
                    text: `Error: ${error.message}. Please try again.`, 
                    sender: 'assistant',
                    threadId: threadId
                }
            ]);
            handleStreamError();
        } finally {
            setIsStreaming(false);
        }
        
        setUploadedFiles([]);
    } else {
        addLog('Attempted to send empty message');
        console.warn('Attempted to send message with no content and no files');
    }
  }, [
    uploadedFiles,
    addLog,
    setIsStreaming,
    setToolCalls,
    setIsToolCallInProgress,
    setPendingToolCalls,
    setIsWaitingForToolCompletion,
    setMessages,
    setUploadedFiles,
    setupEventSource,
    ensureThreadExists,
    handleStreamError
  ]);

  return {
    isStreaming,
    sendMessage,
    setupEventSource,
    closeEventSource,
    finalizeMessage,
    handleStreamError
  };
};