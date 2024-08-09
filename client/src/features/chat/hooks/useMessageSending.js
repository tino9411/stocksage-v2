import { useCallback } from 'react';
import * as chatApi from '../api/chatApi';
import { useThreadManagement } from './useThreadManagement'; // Import the thread management hook

export const useMessageSending = (
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
) => {
  const { isThreadCreated, currentThreadId, createThread, switchThread } = useThreadManagement(); // Use thread management hook

  const sendMessage = useCallback(async (input) => {
    if ((input.trim() || uploadedFiles.length > 0) && isThreadCreated && currentThreadId) {
      const newMessages = [];

      if (uploadedFiles.length > 0) {
        newMessages.push({
          id: Date.now(),
          type: 'files',
          files: uploadedFiles,
          sender: 'user'
        });
      }

      if (input.trim()) {
        newMessages.push({
          id: Date.now() + 1,
          text: input,
          sender: 'user'
        });
      }

      newMessages.push({
        id: Date.now() + 2,
        text: '',
        sender: 'assistant',
        isStreaming: true
      });

      setMessages(prev => [...prev, ...newMessages]);
      addLog(`Sending message: ${input}`);

      try {
        setIsStreaming(true);
        setToolCalls([]);
        setIsToolCallInProgress(false);
        setPendingToolCalls(0);
        setIsWaitingForToolCompletion(false);

        console.log('Sending message to API:', input);
        const response = await chatApi.sendMessage(currentThreadId, input);
        console.log('API response:', response);

        if (!response) {
          throw new Error('No response received from the server');
        }

        if (!response.message || response.message !== 'Message received') {
          throw new Error(`Unexpected response from server: ${JSON.stringify(response)}`);
        }

        setupEventSource('/api/chat/stream');

      } catch (error) {
        console.error('Detailed error in sendMessage:', error);
        setMessages(prev => [
          ...prev, 
          { id: Date.now(), text: `Error: ${error.message}. Please try again.`, sender: 'assistant' }
        ]);
        handleStreamError();
      }
      
      setUploadedFiles([]);
    } else if (!isThreadCreated) {
      // Handle the case where the thread is not created
      await createThread(); // Ensure thread creation
      await sendMessage(input); // Retry sending the message after thread creation
    }
  }, [isThreadCreated, currentThreadId, uploadedFiles, addLog, setIsStreaming, setToolCalls, setIsToolCallInProgress, setPendingToolCalls, setIsWaitingForToolCompletion, finalizeMessage, handleStreamError, setMessages, setUploadedFiles, setupEventSource, createThread]);

  return { sendMessage };
};