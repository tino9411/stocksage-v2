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
    initializeAssistant,
    isInitialized,
    isConversationStarted,
    startConversation,
    sendMessage,
    endChat,
  } = useChatState();

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isInitialized && !isConversationStarted) {
      handleStartConversation();
    }
  }, [isInitialized, isConversationStarted]);

  const handleInitialize = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await initializeAssistant();
    } catch (err) {
      setError("Failed to initialize the assistant. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartConversation = async () => {
    try {
      setIsLoading(true);
      await startConversation();
    } catch (err) {
      setError("Failed to start the conversation. Please try again.");
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
      await endChat();
    } catch (err) {
      setError("Failed to end the chat. Please try again.");
    }
  };

  if (error) {
    return (
      <ChatContainer>
        <Typography color="error">{error}</Typography>
        <Button onClick={handleInitialize}>Retry Initialization</Button>
      </ChatContainer>
    );
  }

  if (!isInitialized || !isConversationStarted) {
    return (
      <ChatContainer>
        {isLoading ? (
          <CircularProgress />
        ) : (
          <Button onClick={handleInitialize} disabled={isLoading}>
            Initialize Assistant
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