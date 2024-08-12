import { useState, useCallback } from 'react';
import * as chatApi from '../api/chatApi';

export const useMessages = () => {
  const [messages, setMessages] = useState([]);

  const loadInitialMessages = useCallback(async (threadId) => {
    console.log('Loading initial messages for thread:', threadId);
    if (threadId) {
      try {
        const threadMessages = await chatApi.getThreadMessages(threadId);
        console.log('Received messages from API:', threadMessages);
        const formattedMessages = threadMessages.map(msg => ({
          id: msg._id,
          text: msg.content,
          sender: msg.role,
          threadId: threadId,
          timestamp: new Date(msg.timestamp)
        }));
        console.log('Formatted messages:', formattedMessages);
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error loading initial messages:', error);
      }
    }
  }, []);

  return {
    messages,
    setMessages,
    loadInitialMessages,
  };
};