import React, { useState, useEffect } from 'react';
import { useChatState } from '../hooks/useChatState';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import InputArea from './InputArea';
import ToolCallHandler from './ToolCallHandler';
import ThreadSidebar from './ThreadSidebar';
import { 
  ChatContainer, 
  ChatLayout, 
  ChatBox, 
  MessageList as StyledMessageList,
  InputArea as StyledInputArea
} from '../styles/chatStyles';
import { Typography, Box } from '@mui/material';



function Chat() {
  const {
    createThread,
    currentThreadId,
    sendMessage,
    endChat,
    switchThread,
    isThreadCreated,
    threads,
    messages,
    loadInitialMessages,
  } = useChatState();

  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentThreadId) {
      loadInitialMessages();
    }
  }, [currentThreadId, loadInitialMessages]);

  useEffect(() => {
    console.log("Messages in Chat component:", messages);
  }, [messages]);

  const handleCreateThread = async () => {
    try {
      setError(null);
      const newThreadId = await createThread();
      if (newThreadId) {
        await switchThread(newThreadId);
      }
    } catch (err) {
      setError("Failed to create a new chat thread. Please try again.");
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
          threads={threads}
          selectedThreadId={currentThreadId}
        />
        <ChatBox>
          <ChatHeader 
            onEndChat={handleEndChat} 
            currentThreadId={currentThreadId}
          />
          <StyledMessageList>
            {isThreadCreated ? (
              <>
                <MessageList messages={messages} currentThreadId={currentThreadId} />
                <ToolCallHandler />
              </>
            ) : (
              <Typography variant="body1" align="center">
              </Typography>
            )}
          </StyledMessageList>
          <StyledInputArea>
            <InputArea onSendMessage={handleSendMessage} />
          </StyledInputArea>
        </ChatBox>
      </ChatLayout>
    </ChatContainer>
  );
}

export default Chat;