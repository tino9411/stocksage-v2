// client/src/hooks/useChatState.js
import { useContext } from 'react';
import { ChatContext } from '../contexts/ChatContext';

export const useChatState = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatState must be used within a ChatProvider');
  }
  return context;
};