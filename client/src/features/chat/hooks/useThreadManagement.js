import { useState, useCallback } from 'react';
import * as chatApi from '../api/chatApi';
import { useUser } from '../../../contexts/UserContext';
import { useMessageSending } from './useMessageSending';

export const useThreadManagement = () => {
  const [threads, setThreads] = useState([]);
  const [isThreadCreated, setIsThreadCreated] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const { user } = useUser();

  const addLog = useCallback((log) => {
    console.log(log);
  }, []);

  const setIsStreaming = useCallback((isStreaming) => {
    // Implement streaming state management
  }, []);

  const setToolCalls = useCallback((toolCalls) => {
    // Implement tool calls state management
  }, []);

  const setIsToolCallInProgress = useCallback((isInProgress) => {
    // Implement tool call progress state management
  }, []);

  const setPendingToolCalls = useCallback((pendingCalls) => {
    // Implement pending tool calls state management
  }, []);

  const setIsWaitingForToolCompletion = useCallback((isWaiting) => {
    // Implement waiting for tool completion state management
  }, []);

  const finalizeMessage = useCallback((message) => {
    // Implement message finalization logic
  }, []);

  const handleStreamError = useCallback(() => {
    // Implement stream error handling
  }, []);

  const setupEventSource = useCallback((url) => {
    // Implement event source setup
  }, []);

  const fetchThreads = useCallback(async () => {
    try {
      const response = await chatApi.getThreads();
      const formattedThreads = response.map(thread => ({
        threadId: thread.threadId,
        ...thread
      }));
      setThreads(formattedThreads);
    } catch (error) {
      console.error('Error fetching threads:', error);
      throw error;
    }
  }, []);

  const createThread = useCallback(async () => {
    try {
      const response = await chatApi.createThread();
      const newThreadId = response.threadId;
      setCurrentThreadId(newThreadId);
      setIsThreadCreated(true);
      await fetchThreads(); // Refresh the thread list
      return newThreadId;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }, [fetchThreads]);

  const { sendMessage: sendMessageInternal } = useMessageSending(
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

  const sendMessage = useCallback(async (input) => {
    if (!isThreadCreated || !currentThreadId) {
      try {
        await createThread();
      } catch (error) {
        console.error('Error creating thread before sending message:', error);
        throw error;
      }
    }
    await sendMessageInternal(input);
  }, [isThreadCreated, currentThreadId, createThread, sendMessageInternal]);

  const endChat = useCallback(async () => {
    if (!currentThreadId) {
      throw new Error('No active thread to end.');
    }
    try {
      await chatApi.endChat(currentThreadId);
      setCurrentThreadId(null);
      setIsThreadCreated(false);
      await fetchThreads(); // Refresh the thread list
    } catch (error) {
      console.error('Error ending chat:', error);
      throw error;
    }
  }, [currentThreadId, fetchThreads]);

  const switchThread = useCallback(async (threadId) => {
    try {
      setCurrentThreadId(threadId);
      setIsThreadCreated(true);
      // Load messages for the selected thread
      const threadMessages = await chatApi.getThreadMessages(threadId);
      setMessages(threadMessages);
    } catch (error) {
      console.error('Error switching thread:', error);
      throw error;
    }
  }, []);

  const deleteThread = useCallback(async (threadId) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    try {
      await chatApi.deleteThread(threadId);
      setThreads(prevThreads => prevThreads.filter(thread => thread.threadId !== threadId));
      if (currentThreadId === threadId) {
        setCurrentThreadId(null);
        setIsThreadCreated(false);
        setMessages([]); // Clear messages when deleting the current thread
      }
      await fetchThreads(); // Refresh the thread list
    } catch (error) {
      console.error('Error deleting thread:', error);
      throw error;
    }
  }, [user, currentThreadId, fetchThreads]);

  return {
    threads,
    fetchThreads,
    deleteThread,
    createThread,
    isThreadCreated,
    currentThreadId,
    sendMessage,
    endChat,
    switchThread,
    messages,
    setUploadedFiles,
  };
};