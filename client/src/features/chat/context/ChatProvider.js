import React, { useMemo, useEffect } from 'react';
import ChatContext from './ChatContext';
import { useMessageHandling } from '../hooks/useMessageHandling';
import { useToolCalls } from '../hooks/useToolCalls';
import { useFileHandling } from '../hooks/useFileHandling';
import { useLogging } from '../hooks/useLogging';
import { useMessageSending } from '../hooks/useMessageSending';
import { useEventSource } from '../hooks/useEventSource';
import { useThreadManagement } from '../hooks/useThreadManagement'; // Import the new hook

export const ChatProvider = ({ children }) => {
  const { logs, addLog, addServerLogs } = useLogging();
  const {
    threads,
    isThreadCreated,
    currentThreadId,
    createThread,
    sendMessage,
    endChat,
    switchThread,
    deleteThread
  } = useThreadManagement(); // Use thread management hook

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
  } = useFileHandling(addLog, addServerLogs, !!currentThreadId, currentThreadId);

  const { setupEventSource, closeEventSource, eventSourceRef } = useEventSource(
    addLog,
    setIsToolCallInProgress,
    setMessages,
    setToolCalls,
    setPendingToolCalls,
    finalizeMessage,
    handleStreamError
  );

  useEffect(() => {
    if (isWaitingForToolCompletion && pendingToolCalls === 0) {
      finalizeMessage();
      setIsToolCallInProgress(false);
      setIsWaitingForToolCompletion(false);
    }
  }, [isWaitingForToolCompletion, pendingToolCalls, finalizeMessage, setIsToolCallInProgress, setIsWaitingForToolCompletion]);

  const contextValue = useMemo(() => ({
    messages,
    currentThreadId,
    createThread,
    sendMessage,
    endChat,
    switchThread,
    deleteThread,
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
    createThread, 
    sendMessage, 
    endChat,
    switchThread,
    deleteThread,
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