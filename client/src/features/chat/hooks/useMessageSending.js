import { useCallback } from 'react';
import * as chatApi from '../api/chatApi';

export const useMessageSending = (
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
) => {
  const sendMessage = useCallback(async (input) => {
    if ((input.trim() || uploadedFiles.length > 0) && isInitialized && isConversationStarted) {
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
        const response = await chatApi.sendMessage(input);
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
    }
  }, [isInitialized, isConversationStarted, uploadedFiles, addLog, setIsStreaming, setToolCalls, setIsToolCallInProgress, setPendingToolCalls, setIsWaitingForToolCompletion, finalizeMessage, handleStreamError, setMessages, setUploadedFiles, setupEventSource]);

  return { sendMessage };
};