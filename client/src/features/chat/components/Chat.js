import React, { useState, useEffect } from 'react';
import { useChatState } from '../hooks/useChatState';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import InputArea from './InputArea';
import ToolCallHandler from './ToolCallHandler';
import ThreadSidebar from './ThreadSidebar';
import { ChatContainer, ChatBox, ChatLayout } from '../styles/chatStyles';
import { Typography} from '@mui/material';

function Chat() {
  const {
    createThread,
    currentThreadId,
    sendMessage,
    endChat,
    switchThread,
    logs,
    isThreadCreated,
    threads, // Add this to get access to the threads state
  } = useChatState();

  const [error, setError] = useState(null);

  const handleCreateThread = async () => {
    try {
      setError(null);
      const newThreadId = await createThread();
      if (newThreadId) {
        await switchThread(newThreadId);
      }
    } catch (err) {
      setError("Failed to create a new chat thread. Please try again.");
    } finally {
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
      await endChat(currentThreadId);
    } catch (err) {
      setError("Failed to end the chat. Please try again.");
    } 
  };

  const handleThreadSelect = async (threadId) => {
    try {
      await switchThread(threadId);
    } catch (err) {
      setError("Failed to switch thread. Please try again.");
    }
  };

  if (error) {
    return (
      <ChatContainer>
        <Typography color="error">{error}</Typography>
      </ChatContainer>
    );
  }

  return (
    <ChatContainer>
      <ChatLayout>
        <ThreadSidebar 
          onSelectThread={handleThreadSelect} 
          onCreateThread={handleCreateThread}
          threads={threads} // Pass threads to ThreadSidebar
          selectedThreadId={currentThreadId}
        />
        <ChatBox>
          <ChatHeader 
            onEndChat={handleEndChat} 
            currentThreadId={currentThreadId}
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