import { useState, useCallback, useEffect } from 'react';
import * as chatApi from '../api/chatApi';
import { useUser } from '../../../contexts/UserContext';

export const useThreadManagement = () => {
  const [threads, setThreads] = useState([]);
  const [isThreadCreated, setIsThreadCreated] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState(null);
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
      setIsThreadCreated(true);
      setThreads(prevThreads => [...prevThreads, { threadId: newThreadId, createdAt: new Date() }]);
      return newThreadId;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }, []);

  const sendMessage = useCallback(async (input) => {
    if (!isThreadCreated || !currentThreadId) {
      try {
        await createThread();
      } catch (error) {
        console.error('Error creating thread before sending message:', error);
        throw error;
      }
    }
    try {
      const response = await chatApi.sendMessage(currentThreadId, input);
      setMessages(prevMessages => [...prevMessages, { id: Date.now(), text: input, sender: 'user' }]);
      if (response.message) {
        setMessages(prevMessages => [...prevMessages, { id: Date.now(), text: response.message, sender: 'assistant' }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [isThreadCreated, currentThreadId, createThread]);

  const endChat = useCallback(async () => {
    if (!currentThreadId) {
      throw new Error('No active thread to end.');
    }
    try {
      await chatApi.endChat(currentThreadId);
      setThreads(prevThreads => prevThreads.filter(thread => thread.threadId !== currentThreadId));
      setCurrentThreadId(null);
      setIsThreadCreated(false);
      setMessages([]);
      // Trigger a re-fetch of threads to ensure UI is up-to-date
      fetchThreads();
    } catch (error) {
      console.error('Error ending chat:', error);
      throw error;
    }
  }, [currentThreadId, fetchThreads]);

  const switchThread = useCallback(async (threadId) => {
    try {
      setCurrentThreadId(threadId);
      setIsThreadCreated(true);
      const threadMessages = await chatApi.getThreadMessages(threadId);
      setMessages(threadMessages);
    } catch (error) {
      console.error('Error switching thread:', error);
      throw error;
    }
  }, []);

  return {
    threads,
    fetchThreads,
    createThread,
    isThreadCreated,
    currentThreadId,
    sendMessage,
    endChat,
    switchThread,
    messages,
    uploadedFiles,
    setUploadedFiles,
  };
};