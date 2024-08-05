import React, { useMemo, useEffect } from 'react';
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

  const {
    messages,
    setMessages,
    isInitialized,
    setIsInitialized,
    isConversationStarted,
    setIsConversationStarted,
    isStreaming,
    setIsStreaming,
    initializeAssistant,
    startConversation,
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
  } = useFileHandling(addLog, addServerLogs, isInitialized, isConversationStarted);

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
    isInitialized,
    isConversationStarted,
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
      const response = await chatApi.endChat();
      setMessages([]);
      setIsInitialized(false);
      setIsConversationStarted(false);
      clearToolCalls();
      setIsStreaming(false);
      addLog('Chat ended successfully');
      if (response && response.data && response.data.logs) {
        addServerLogs(response.data.logs);
      } else {
        addLog('No server logs received');
      }
    } catch (error) {
      console.error('Error ending chat:', error);
      addLog(`Error ending chat: ${error.message}`);
    }
  };

  const contextValue = useMemo(() => ({
    messages,
    isInitialized,
    isConversationStarted,
    initializeAssistant,
    startConversation,
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
    isInitialized, 
    isConversationStarted, 
    initializeAssistant, 
    startConversation, 
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