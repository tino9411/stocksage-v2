// useThreadManagement.js
import { useState, useCallback, useEffect } from 'react';
import * as chatApi from '../api/chatApi';
import { useUser } from '../../../contexts/UserContext';

export const useThreadManagement = () => {
  const [threads, setThreads] = useState([]);
  const [isThreadCreated, setIsThreadCreated] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState(() => localStorage.getItem('currentThreadId') || null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [messages, setMessages] = useState([]);
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
    }
  }, []);

  useEffect(() => {
    fetchThreads();
    const intervalId = setInterval(fetchThreads, 30000);
    return () => clearInterval(intervalId);
  }, [fetchThreads]);

  const createThread = useCallback(async () => {
    try {
      const response = await chatApi.createThread();
      const newThreadId = response.threadId;
      setCurrentThreadId(newThreadId);
      localStorage.setItem('currentThreadId', newThreadId);
      setIsThreadCreated(true);
      setThreads(prevThreads => [...prevThreads, { threadId: newThreadId, createdAt: new Date() }]);
      setMessages([]);
      return newThreadId;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }, []);

  const endChat = useCallback(async () => {
    if (!currentThreadId) {
      throw new Error('No active thread to end.');
    }
    try {
      await chatApi.endChat(currentThreadId);
      setThreads(prevThreads => prevThreads.filter(thread => thread.threadId !== currentThreadId));
      setCurrentThreadId(null);
      localStorage.removeItem('currentThreadId');
      setIsThreadCreated(false);
      setMessages([]);
      fetchThreads();
    } catch (error) {
      console.error('Error ending chat:', error);
      throw error;
    }
  }, [currentThreadId, fetchThreads]);

  const loadInitialMessages = useCallback(async () => {
    console.log('Loading initial messages for thread:', currentThreadId);
    if (currentThreadId) {
      try {
        const threadMessages = await chatApi.getThreadMessages(currentThreadId);
        console.log('Received messages from API:', threadMessages);
        const formattedMessages = threadMessages.map(msg => ({
          id: msg._id,
          text: msg.content,
          sender: msg.role,
          threadId: currentThreadId,
          timestamp: new Date(msg.timestamp)
        }));
        console.log('Formatted messages:', formattedMessages);
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error loading initial messages:', error);
      }
    }
  }, [currentThreadId]);

  const switchThread = useCallback(async (threadId) => {
    try {
      setCurrentThreadId(threadId);
      localStorage.setItem('currentThreadId', threadId);
      setIsThreadCreated(true);
      await loadInitialMessages();
    } catch (error) {
      console.error('Error switching thread:', error);
      throw error;
    }
  }, [loadInitialMessages]);

  useEffect(() => {
    if (currentThreadId) {
      loadInitialMessages();
    }
  }, [currentThreadId, loadInitialMessages]);

  // New function to ensure a thread exists
  const ensureThreadExists = useCallback(async () => {
    if (!isThreadCreated || !currentThreadId) {
      const newThreadId = await createThread();
      await switchThread(newThreadId);
      return newThreadId;
    }
    return currentThreadId;
  }, [isThreadCreated, currentThreadId, createThread, switchThread]);

  return {
    threads,
    fetchThreads,
    createThread,
    isThreadCreated,
    currentThreadId,
    endChat,
    switchThread,
    messages,
    setMessages,
    uploadedFiles,
    setUploadedFiles,
    loadInitialMessages,
    ensureThreadExists, // New function exposed
  };
};