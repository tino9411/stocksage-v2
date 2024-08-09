import { useState, useCallback, useRef } from 'react';
import axiosInstance from '../../../axiosConfig';

export const useMessageHandling = (addLog, addServerLogs) => {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef(null);

  // Finalize the last message
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

  // Handle stream errors
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
    isStreaming,
    setIsStreaming,
    eventSourceRef,
    finalizeMessage,
    handleStreamError
  };
};