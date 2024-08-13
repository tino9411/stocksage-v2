import React, { useMemo, useEffect } from 'react';
import ChatContext from './ChatContext';
import { useToolCalls } from '../hooks/useToolCalls';
import { useFileHandling } from '../hooks/useFileHandling';
import { useLogging } from '../hooks/useLogging';
import { useThreads } from '../hooks/useThreads';
import { useMessages } from '../hooks/useMessages';
import { useChat } from '../hooks/useChat';

export const ChatProvider = ({ children }) => {
  const { logs, addLog, addServerLogs } = useLogging();
  
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
  } = useFileHandling(addLog, addServerLogs);

  const {
    threads,
    fetchThreads,
    createThread,
    isThreadCreated,
    currentThreadId,
    endChat,
    switchThread,
    ensureThreadExists
  } = useThreads();

  const {
    messages,
    setMessages,
    loadInitialMessages
  } = useMessages();

  const {
    isStreaming,
    sendMessage,
    setupEventSource,
    closeEventSource,
    finalizeMessage,
    handleStreamError,
    subAssistantMessages,  // Add this line
    setSubAssistantMessages // Add this line
  } = useChat(
    addLog,
    setMessages,
    setToolCalls,
    setIsToolCallInProgress,
    setPendingToolCalls,
    setIsWaitingForToolCompletion,
    uploadedFiles,
    setUploadedFiles,
    ensureThreadExists
  );

  useEffect(() => {
    if (currentThreadId) {
      loadInitialMessages(currentThreadId);
    }
  }, [currentThreadId, loadInitialMessages]);

  const contextValue = useMemo(() => ({
    messages,
    setMessages,
    currentThreadId,
    isThreadCreated,
    createThread,
    sendMessage,
    endChat,
    switchThread,
    threads,
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
    loadInitialMessages,
    fetchThreads,
    setupEventSource,
    closeEventSource,
    finalizeMessage,
    handleStreamError,
    pendingToolCalls,
    subAssistantMessages, // Add this line
    setSubAssistantMessages // Add this line
  }), [
    messages,
    setMessages,
    currentThreadId,
    isThreadCreated,
    createThread,
    sendMessage,
    endChat,
    switchThread,
    threads,
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
    loadInitialMessages,
    fetchThreads,
    setupEventSource,
    closeEventSource,
    finalizeMessage,
    handleStreamError,
    pendingToolCalls,
    subAssistantMessages, // Add this line
    setSubAssistantMessages // Add this line
  ]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;