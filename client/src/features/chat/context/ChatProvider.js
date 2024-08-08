// client/src/features/chat/context/ChatProvider.js

import React, { useMemo, useEffect, useState } from 'react';
import ChatContext from './ChatContext';
import { useMessageHandling } from '../hooks/useMessageHandling';
import { useToolCalls } from '../hooks/useToolCalls';
import { useFileHandling } from '../hooks/useFileHandling';
import { useLogging } from '../hooks/useLogging';
import { useMessageSending } from '../hooks/useMessageSending';
import { useEventSource } from '../hooks/useEventSource';
import * as chatApi from '../api/chatApi';

export const ChatProvider = ({ children }) => {
  const { logs, addLog, addServerLogs } = useLogging();
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [isThreadCreated, setIsThreadCreated] = useState(false);

  const {
    messages,
    setMessages,
    isStreaming,
    setIsStreaming,
    finalizeMessage,
    handleStreamError
  } = useMessageHandling(addLog, addServerLogs);
  const {
    toolCalls,
    setToolCalls,
    isToolCallInProgress,
    setIsToolCallInProgress,
    pendingToolCalls,
    setPendingToolCalls,
    isWaitingForToolCompletion,
    setIsWaitingForToolCompletion,
    updateToolCallOutput,
    clearToolCalls
  } = useToolCalls();

  const {
    uploadingFiles,
    uploadedFiles,
    setUploadedFiles,
    uploadFile,
    removeUploadedFile
  } = useFileHandling(addLog, addServerLogs, isThreadCreated, currentThreadId);

  const { setupEventSource, closeEventSource, eventSourceRef } = useEventSource(
    addLog,
    setIsToolCallInProgress,
    setMessages,
    setToolCalls,
    setPendingToolCalls,
    finalizeMessage,
    handleStreamError
  );

  const createThread = async () => {
    try {
      const response = await chatApi.createThread();
      setCurrentThreadId(response.threadId);
      setIsThreadCreated(true);
      addLog('Thread created successfully');
      return response.threadId;
    } catch (error) {
      console.error('Error creating thread:', error);
      addLog(`Error creating thread: ${error.message}`);
      throw error;
    }
  };

  const { sendMessage } = useMessageSending(
    isThreadCreated,
    currentThreadId,
    uploadedFiles,
    addLog,
    setIsStreaming,
    setToolCalls,
    setIsToolCallInProgress,
    setPendingToolCalls,
    setIsWaitingForToolCompletion,
    finalizeMessage,
    handleStreamError,
    setMessages,
    setUploadedFiles,
    setupEventSource
  );

  useEffect(() => {
    if (isWaitingForToolCompletion && pendingToolCalls === 0) {
      finalizeMessage();
      setIsToolCallInProgress(false);
      setIsWaitingForToolCompletion(false);
    }
  }, [isWaitingForToolCompletion, pendingToolCalls, finalizeMessage, setIsToolCallInProgress, setIsWaitingForToolCompletion]);

  const endChat = async () => {
    try {
      addLog('Ending chat...');
      closeEventSource();
      addLog('Event stream closed');
      if (currentThreadId) {
        const response = await chatApi.endChat(currentThreadId);
        setMessages([]);
        setCurrentThreadId(null);
        clearToolCalls();
        setIsStreaming(false);
        addLog('Chat ended successfully');
        if (response && response.logs) {
          addServerLogs(response.logs);
        } else {
          addLog('No server logs received');
        }

        // Automatically create a new thread
        await createThread();
        addLog('New thread created automatically');
      } else {
        addLog('No active thread to end');
      }
    } catch (error) {
      console.error('Error ending chat:', error);
      addLog(`Error ending chat: ${error.message}`);
    }
  };

  const contextValue = useMemo(() => ({
    messages,
    isThreadCreated,
    currentThreadId,
    createThread,
    sendMessage,
    endChat,
    logs,
    addLog,
    isStreaming,
    isToolCallInProgress,
    toolCalls,
    updateToolCallOutput,
    clearToolCalls,
    isWaitingForToolCompletion,
    uploadFile,
    removeUploadedFile,
    uploadingFiles,
    uploadedFiles,
    setUploadedFiles,
  }), [
    messages, 
    isThreadCreated,
    currentThreadId,
    sendMessage, 
    logs, 
    addLog, 
    isStreaming, 
    isToolCallInProgress, 
    toolCalls, 
    updateToolCallOutput, 
    clearToolCalls, 
    isWaitingForToolCompletion, 
    uploadFile, 
    removeUploadedFile,
    uploadingFiles,
    uploadedFiles
  ]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;