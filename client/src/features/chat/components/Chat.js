import React, { useState, useEffect } from 'react';
import { useChatState } from '../hooks/useChatState';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import InputArea from './InputArea';
import ToolCallHandler from './ToolCallHandler';
import ThreadSidebar from './ThreadSidebar';
import { ChatContainer, ChatBox, ChatLayout } from '../styles/chatStyles';
import { Button, Typography, CircularProgress, Snackbar } from '@mui/material';

function Chat() {
  const {
    createThread,
    currentThreadId,
    sendMessage,
    endChat,
    switchThread,
    logs,
    isThreadCreated,
  } = useChatState();

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleCreateThread = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const newThreadId = await createThread();
      if (newThreadId) {
        await switchThread(newThreadId);
        setSnackbarMessage('New thread created successfully');
        setSnackbarOpen(true);
      }
    } catch (err) {
      setError("Failed to create a new chat thread. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message) => {
    if (message.trim() && currentThreadId) {
      try {
        await sendMessage(message, currentThreadId);
      } catch (err) {
        setError("Failed to send message. Please try again.");
      }
    } else if (!currentThreadId) {
      setError("No active thread. Please create or select a thread first.");
    }
  };

  const handleEndChat = async () => {
    if (!currentThreadId) {
      setError("No active thread to end.");
      return;
    }
    try {
      setIsLoading(true);
      await endChat(currentThreadId);
      setSnackbarMessage('Chat ended successfully');
      setSnackbarOpen(true);
    } catch (err) {
      setError("Failed to end the chat. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleThreadSelect = async (threadId) => {
    try {
      setIsLoading(true);
      await switchThread(threadId);
      setSnackbarMessage('Switched to selected thread');
      setSnackbarOpen(true);
    } catch (err) {
      setError("Failed to switch thread. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  if (error) {
    return (
      <ChatContainer>
        <Typography color="error">{error}</Typography>
        <Button onClick={() => setError(null)}>Dismiss</Button>
      </ChatContainer>
    );
  }

  return (
    <ChatContainer>
      <ChatLayout>
        <ThreadSidebar onSelectThread={handleThreadSelect} onCreateThread={handleCreateThread} />
        <ChatBox>
          <ChatHeader 
            onEndChat={handleEndChat} 
            currentThreadId={currentThreadId}
            onBackClick={() => {/* Handle navigation back */}}
          />
          {isThreadCreated ? (
            <>
              <MessageList />
              <ToolCallHandler />
              <InputArea onSendMessage={handleSendMessage} />
            </>
          ) : (
            <Typography variant="body1" align="center">
              Please create or select a thread to start chatting.
            </Typography>
          )}
        </ChatBox>
      </ChatLayout>
    </ChatContainer>
  );
}

export default Chat;