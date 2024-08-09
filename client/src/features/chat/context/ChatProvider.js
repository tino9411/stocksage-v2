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
  } = useFileHandling(addLog, addServerLogs);

  const { setupEventSource, closeEventSource, eventSourceRef } = useEventSource(
    addLog,
    setIsToolCallInProgress,
    setMessages,
    setToolCalls,
    setPendingToolCalls,
    finalizeMessage,
    handleStreamError
  );

  const {
    threads,
    isThreadCreated,
    currentThreadId,
    createThread,
    endChat,
    switchThread,
    deleteThread
  } = useThreadManagement();

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
    isThreadCreated,
    currentThreadId,
    createThread
  );

  const contextValue = useMemo(() => ({
    messages,
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
  }), [
    messages, 
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
    uploadedFiles
  ]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;