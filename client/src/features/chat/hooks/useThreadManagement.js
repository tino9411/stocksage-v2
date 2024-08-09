import { useState, useCallback } from 'react';
import * as chatApi from '../api/chatApi'; // Use chatApi for API calls
import { useUser } from '../../../contexts/UserContext';

export const useThreadManagement = () => {
  const [threads, setThreads] = useState([]);
  const [isThreadCreated, setIsThreadCreated] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const { user } = useUser(); // Get user from UserContext

  const fetchThreads = useCallback(async () => {
    try {
      const response = await chatApi.getThreads();
      // Process threads to extract only the needed information
      const formattedThreads = response.map(thread => ({
        threadId: thread.threadId, // Extract threadId
        ...thread // Include other fields if needed
      }));
      setThreads(formattedThreads);
    } catch (error) {
      console.error('Error fetching threads:', error);
    }
  }, []);

  const createThread = useCallback(async () => {
    try {
      const response = await chatApi.createThread();
      // Set the new threadId and update state
      setCurrentThreadId(response.threadId);
      setIsThreadCreated(true);
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }, []);

  const sendMessage = useCallback(async (message) => {
    if (currentThreadId) {
      try {
        await chatApi.sendMessage(currentThreadId, message);
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    }
  }, [currentThreadId]);

  const endChat = useCallback(async () => {
    if (currentThreadId) {
      try {
        await chatApi.endChat(currentThreadId);
        setCurrentThreadId(null);
        setIsThreadCreated(false);
      } catch (error) {
        console.error('Error ending chat:', error);
        throw error;
      }
    }
  }, [currentThreadId]);

  const switchThread = useCallback(async (threadId) => {
    try {
      setCurrentThreadId(threadId);
    } catch (error) {
      console.error('Error switching thread:', error);
      throw error;
    }
  }, []);

  const deleteThread = useCallback(async (threadId) => {
    if (!user) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }

    try {
      await chatApi.deleteThread(threadId, user._id); // Pass user._id to the API call
      setThreads(prevThreads => prevThreads.filter(thread => thread.threadId !== threadId));
    } catch (error) {
      console.error('Error deleting thread:', error);
      throw error;
    }
  }, [user]);

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