import { useCallback } from 'react';
import * as chatApi from '../api/chatApi';

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
  setupEventSource,
  isThreadCreated,
  currentThreadId,
  createThread
) => {
  const sendMessage = useCallback(async (input) => {
    if ((input.trim() || uploadedFiles.length > 0) && isThreadCreated && currentThreadId) {
      const newMessages = [];
      
      // Handle file uploads
      if (uploadedFiles.length > 0) {
        newMessages.push({
          id: Date.now(),
          type: 'files',
          files: uploadedFiles,
          sender: 'user',
          threadId: currentThreadId
        });
      }
      
      // Handle text input
      if (input.trim()) {
        newMessages.push({
          id: Date.now() + 1,
          text: input,
          sender: 'user',
          threadId: currentThreadId
        });
      }
      
      // Add placeholder for assistant's response
      newMessages.push({
        id: Date.now() + 2,
        text: '',
        sender: 'assistant',
        isStreaming: true,
        threadId: currentThreadId
      });

      // Update messages in the UI
      setMessages(prev => [...prev, ...newMessages]);
      addLog(`Sending message: ${input}`);

      try {
        // Prepare for streaming response
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

        // Set up event source for streaming the assistant's response
        setupEventSource('/api/chat/stream');
      } catch (error) {
        console.error('Detailed error in sendMessage:', error);
        setMessages(prev => [
          ...prev, 
          { 
            id: Date.now(), 
            text: `Error: ${error.message}. Please try again.`, 
            sender: 'assistant',
            threadId: currentThreadId
          }
        ]);
        handleStreamError();
      }
      
      // Clear uploaded files after sending
      setUploadedFiles([]);
    } else if (!isThreadCreated) {
      // Handle the case where the thread is not created
      try {
        await createThread(); // Ensure thread creation
        await sendMessage(input); // Retry sending the message after thread creation
      } catch (error) {
        console.error('Error creating thread:', error);
        addLog(`Error creating thread: ${error.message}`);
        setMessages(prev => [
          ...prev, 
          { 
            id: Date.now(), 
            text: `Error: Failed to create a new thread. Please try again.`, 
            sender: 'assistant',
            threadId: null
          }
        ]);
      }
    } else {
      // Handle case where there's no input and no files
      addLog('Attempted to send empty message');
      console.warn('Attempted to send message with no content and no files');
    }
  }, [
    isThreadCreated, 
    currentThreadId, 
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
    createThread
  ]);

  return { sendMessage };
};