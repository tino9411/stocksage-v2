// client/src/features/chat/components/Chat.js

import React, { useState, useEffect } from 'react';
import { useChatState } from '../hooks/useChatState';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import InputArea from './InputArea';
import ToolCallHandler from './ToolCallHandler';
import { ChatContainer, ChatBox } from '../styles/chatStyles';
import { Button, Typography, CircularProgress } from '@mui/material';

function Chat() {
  const {
    createThread,
    isThreadCreated,
    currentThreadId,
    sendMessage,
    endChat,
  } = useChatState();

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isThreadCreated) {
      handleCreateThread();
    }
  }, [isThreadCreated]);

  const handleCreateThread = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await createThread();
    } catch (err) {
      setError("Failed to create a new chat thread. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message) => {
    if (message.trim()) {
      try {
        await sendMessage(message);
      } catch (err) {
        setError("Failed to send message. Please try again.");
      }
    }
  };

  const handleEndChat = async () => {
    try {
      setIsLoading(true);
      await endChat();
      // No need to call handleCreateThread here as it's done in endChat
    } catch (err) {
      setError("Failed to end the chat. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <ChatContainer>
        <Typography color="error">{error}</Typography>
        <Button onClick={handleCreateThread}>Retry</Button>
      </ChatContainer>
    );
  }

  if (!isThreadCreated) {
    return (
      <ChatContainer>
        {isLoading ? (
          <CircularProgress />
        ) : (
          <Button onClick={handleCreateThread} disabled={isLoading}>
            Start New Chat
          </Button>
        )}
      </ChatContainer>
    );
  }

  return (
    <ChatContainer>
      <ChatBox>
        <ChatHeader onEndChat={handleEndChat} />
        <MessageList />
        <ToolCallHandler />
        <InputArea onSendMessage={handleSendMessage} />
      </ChatBox>
    </ChatContainer>
  );
}

export default Chat;