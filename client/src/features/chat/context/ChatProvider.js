// ChatProvider.js
import React, { useMemo } from 'react';
import ChatContext from './ChatContext';
import { useMessageHandling } from '../hooks/useMessageHandling';
import { useToolCalls } from '../hooks/useToolCalls';
import { useFileHandling } from '../hooks/useFileHandling';
import { useLogging } from '../hooks/useLogging';
import { useThreadManagement } from '../hooks/useThreadManagement';
import { useEventSource } from '../hooks/useEventSource';
import { useMessageSending } from '../hooks/useMessageSending';

export const ChatProvider = ({ children }) => {
  const { logs, addLog, addServerLogs } = useLogging();
  
  const {
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
  } = useFileHandling(addLog, addServerLogs);

  const {
    threads,
    isThreadCreated,
    currentThreadId,
    createThread,
    endChat,
    switchThread,
    deleteThread,
    loadInitialMessages,
    messages,
    setMessages,
    ensureThreadExists // New function
  } = useThreadManagement();

  const { setupEventSource, closeEventSource, eventSourceRef } = useEventSource(
    addLog,
    setIsToolCallInProgress,
    setMessages,
    setToolCalls,
    setPendingToolCalls,
    finalizeMessage,
    handleStreamError
  );

  const { sendMessage } = useMessageSending(
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
    setupEventSource,
    ensureThreadExists // Pass the new function instead of isThreadCreated, currentThreadId, createThread, and switchThread
  );

  const contextValue = useMemo(() => ({
    messages,
    setMessages,
    currentThreadId,
    isThreadCreated,
    createThread,
    sendMessage,
    endChat,
    switchThread,
    deleteThread,
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
  }), [
    messages,
    setMessages,
    currentThreadId,
    isThreadCreated,
    createThread, 
    sendMessage, 
    endChat,
    switchThread,
    deleteThread,
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
    loadInitialMessages,
  ]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;