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
      handleEventSourceMessage(data);
    };

    eventSourceRef.current.addEventListener('toolCallCreated', handleToolCallCreated);
    eventSourceRef.current.addEventListener('toolCallCompleted', handleToolCallCompleted);
    eventSourceRef.current.addEventListener('end', handleEventSourceEnd);
  }, []);

  const handleEventSourceMessage = useCallback((data) => {
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
    addLog(`Tool call created: ${data.toolCall.function.name}`);
    setToolCalls(prev => [
      ...prev, 
      { 
        ...data.toolCall, 
        function: {
          ...data.toolCall.function,
          arguments: JSON.stringify(data.toolCall.function.arguments)
        },
        output: null 
      }
    ]);
    setIsToolCallInProgress(true);
    setPendingToolCalls(prev => prev + 1);
  }, [addLog, setToolCalls, setIsToolCallInProgress, setPendingToolCalls]);

  const handleToolCallCompleted = useCallback((event) => {
    const data = JSON.parse(event.data);
    addLog(`Tool call completed: ${data.id}`);
    setToolCalls(prev => prev.map(call =>
      call.id === data.id ? { 
        ...call, 
        output: JSON.stringify(data.output) 
      } : call
    ));
    setPendingToolCalls(prev => prev - 1);
  }, [addLog, setToolCalls, setPendingToolCalls]);

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

  const finalizeMessage = useCallback(async () => {
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      return [
        ...prev.slice(0, -1),
        { ...lastMessage, text: currentMessageRef.current, isStreaming: false }
      ];
    });
    setIsStreaming(false);
    closeEventSource();

    // Save the message to the database
    try {
      if (!currentThreadIdRef.current) {
        throw new Error('No active thread to save message');
      }
      await chatApi.saveMessage(currentThreadIdRef.current, {
        role: 'assistant',
        content: currentMessageRef.current
      });
      addLog('Message saved to database');
    } catch (error) {
      console.error('Error saving message to database:', error);
      addLog(`Error saving message to database: ${error.message}`);
    }

    // Reset the current message
    currentMessageRef.current = '';
  }, [setMessages, closeEventSource, addLog]);

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