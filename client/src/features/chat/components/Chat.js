import React, { useState, useEffect } from 'react';
import { useChatState } from '../hooks/useChatState'; // Import hook for chat state
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import InputArea from './InputArea';
import ToolCallHandler from './ToolCallHandler';
import ThreadSidebar from './ThreadSidebar';
import { ChatContainer, ChatBox, ChatLayout } from '../styles/chatStyles';
import { Button, Typography, CircularProgress } from '@mui/material';

function Chat() {
  const {
    createThread,
    currentThreadId,
    sendMessage,
    endChat,
    switchThread,
    logs,
  } = useChatState(); // Use chat state hook

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateThread = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await createThread(); // Trigger thread creation
    } catch (err) {
      setError("Failed to create a new chat thread. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message) => {
    if (message.trim()) {
      try {
        await sendMessage(message); // Send message to the current thread
      } catch (err) {
        setError("Failed to send message. Please try again.");
      }
    }
  };

  const handleEndChat = async () => {
    try {
      setIsLoading(true);
      await endChat(); // End the current chat
    } catch (err) {
      setError("Failed to end the chat. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleThreadSelect = async (threadId) => {
    await switchThread(threadId); // Switch to a different thread
  };

  if (error) {
    return (
      <ChatContainer>
        <Typography color="error">{error}</Typography>
        <Button onClick={handleCreateThread}>Retry</Button>
      </ChatContainer>
    );
  }

  return (
    <ChatContainer>
      <ChatLayout>
        <ThreadSidebar onSelectThread={handleThreadSelect} />
        <ChatBox>
          <ChatHeader 
            onCreateThread={handleCreateThread} 
            onEndChat={handleEndChat} 
            currentThreadId={currentThreadId} // Pass currentThreadId to header
          />
          {isLoading ? (
            <CircularProgress />
          ) : (
            <>
              <MessageList />
              <ToolCallHandler />
              <InputArea onSendMessage={handleSendMessage} />
            </>
          )}
        </ChatBox>
      </ChatLayout>
    </ChatContainer>
  );
}

export default Chat;