import { useState, useCallback } from 'react';
import * as chatApi from '../api/chatApi';
import { useUser } from '../../../contexts/UserContext';

export const useThreadManagement = () => {
  const [threads, setThreads] = useState([]);
  const [isThreadCreated, setIsThreadCreated] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const { user } = useUser();

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
      setCurrentThreadId(response.threadId);
      setIsThreadCreated(true);
      await fetchThreads(); // Refresh the thread list
      return response.threadId;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }, [fetchThreads]);

  const sendMessage = useCallback(async (message, threadId) => {
    if (!threadId) {
      throw new Error('No active thread. Please create or select a thread first.');
    }
    try {
      const response = await chatApi.sendMessage(threadId, message);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, []);

  const endChat = useCallback(async (threadId) => {
    if (!threadId) {
      throw new Error('No active thread to end.');
    }
    try {
      await chatApi.endChat(threadId);
      setCurrentThreadId(null);
      setIsThreadCreated(false);
      await fetchThreads(); // Refresh the thread list
    } catch (error) {
      console.error('Error ending chat:', error);
      throw error;
    }
  }, [fetchThreads]);

  const switchThread = useCallback(async (threadId) => {
    try {
      setCurrentThreadId(threadId);
      setIsThreadCreated(true);
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
  };
};