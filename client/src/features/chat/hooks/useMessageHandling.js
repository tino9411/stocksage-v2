import { useState, useCallback, useRef } from 'react';
import axiosInstance from '../../../axiosConfig';

export const useMessageHandling = (addLog, addServerLogs) => {
  const [messages, setMessages] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConversationStarted, setIsConversationStarted] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef(null);

  const initializeAssistant = useCallback(async () => {
    try {
      addLog('Initializing assistant...');
      const response = await axiosInstance.post('/api/chat/initialize');
      setIsInitialized(true);
      addLog('Assistant initialized successfully');
      addServerLogs(response.data.logs);
    } catch (error) {
      console.error('Failed to initialize assistant:', error);
      addLog('Error initializing assistant');
      throw error;
    }
  }, [addLog, addServerLogs]);

  const startConversation = useCallback(async () => {
    if (isInitialized && !isConversationStarted) {
      try {
        addLog('Starting conversation...');
        const response = await axiosInstance.post('/api/chat/start', { message: "Start conversation" });
        setMessages([{ text: response.data.message, sender: 'assistant' }]);
        setIsConversationStarted(true);
        addLog('Conversation started successfully');
        addServerLogs(response.data.logs);
      } catch (error) {
        console.error('Error starting conversation:', error);
        addLog('Error starting conversation');
        throw error;
      }
    }
  }, [isInitialized, isConversationStarted, addLog, addServerLogs]);

  const finalizeMessage = useCallback(() => {
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      return [
        ...prev.slice(0, -1),
        { ...lastMessage, isStreaming: false }
      ];
    });
    setIsStreaming(false);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const handleStreamError = useCallback(() => {
    setIsStreaming(false);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  return {
    messages,
    setMessages,
    isInitialized,
    setIsInitialized,
    isConversationStarted,
    setIsConversationStarted,
    isStreaming,
    setIsStreaming,
    eventSourceRef,
    initializeAssistant,
    startConversation,
    finalizeMessage,
    handleStreamError
  };
};