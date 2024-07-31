import React, { useRef, useEffect, useCallback } from 'react';
import { List, ListItem } from '@mui/material';
import { useChatState } from '../../hooks/useChatState';
import MessageBubble from './MessageBubble';
import { MessageList as StyledMessageList } from '../../styles/chatStyles';

function MessageList() {
  const { messages, isStreaming } = useChatState();
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isStreaming) {
      scrollToBottom();
    }
  }, [messages, isStreaming, scrollToBottom]);

  return (
    <StyledMessageList component={List}>
      {messages.map((message) => (
        <ListItem
          key={message.id}
          style={{ justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start' }}
        >
          <MessageBubble message={message} />
        </ListItem>
      ))}
      <div ref={messagesEndRef} />
    </StyledMessageList>
  );
}

export default React.memo(MessageList);