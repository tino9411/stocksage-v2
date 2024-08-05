import React, { createContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import axiosInstance from '../axiosConfig'; 

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConversationStarted, setIsConversationStarted] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolCalls, setToolCalls] = useState([]);
  const eventSourceRef = useRef(null);
  const [isToolCallInProgress, setIsToolCallInProgress] = useState(false);
  const [pendingToolCalls, setPendingToolCalls] = useState(0);
  const [isWaitingForToolCompletion, setIsWaitingForToolCompletion] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const addLog = useCallback(debounce((log) => {
    console.log(log);
    setLogs((prevLogs) => [...prevLogs, log]);
  }, 300), []);

  const addServerLogs = useCallback((serverLogs) => {
    if (Array.isArray(serverLogs)) {
      setLogs((prevLogs) => [...prevLogs, ...serverLogs]);
    }
  }, []);

  const initializeAssistant = useCallback(async () => {
    try {
      addLog('Initializing assistant...');
      const response = await axiosInstance.post('/api/chat/initialize');
      setIsInitialized(true);
      addLog('Assistant initialized successfully');
      addServerLogs(response.data.logs);
    } catch (error) {
      console.error('Failed to initialize assistant:', error);
      addLog('Error initializing assistant');
      throw error;
    }
  }, [addLog, addServerLogs]);

  const startConversation = useCallback(async () => {
    if (isInitialized && !isConversationStarted) {
      try {
        addLog('Starting conversation...');
        const response = await axiosInstance.post('/api/chat/start', { message: "Start conversation" });
        setMessages([{ text: response.data.message, sender: 'assistant' }]);
        setIsConversationStarted(true);
        addLog('Conversation started successfully');
        addServerLogs(response.data.logs);
      } catch (error) {
        console.error('Error starting conversation:', error);
        addLog('Error starting conversation');
        throw error;
      }
    }
  }, [isInitialized, isConversationStarted, addLog, addServerLogs]);

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

        const response = await axiosInstance.post('/api/chat/stream/message', { message: input });

        if (response.status !== 200) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        eventSourceRef.current = new EventSource('/api/chat/stream');

        eventSourceRef.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          addLog(`Received message: ${JSON.stringify(data)}`);
          if (data.type === 'textDelta') {
            setIsToolCallInProgress(false);
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              return [
                ...prev.slice(0, -1),
                {
                  ...lastMessage,
                  text: lastMessage.text + data.content,
                  isStreaming: true
                }
              ];
            });
          }
        };

        eventSourceRef.current.addEventListener('toolCallCreated', (event) => {
          const data = JSON.parse(event.data);
          console.log('Tool call created:', data);
          addLog(`Tool call created: ${data.toolCall.function.name}`);
          setToolCalls(prev => [
            ...prev, 
            { 
              ...data.toolCall, 
              function: {
                ...data.toolCall.function,
                arguments: JSON.stringify(data.toolCall.function.arguments)
              },
              output: null 
            }
          ]);
          setIsToolCallInProgress(true);
          setPendingToolCalls(prev => prev + 1);
        });
  
        eventSourceRef.current.addEventListener('toolCallCompleted', (event) => {
          const data = JSON.parse(event.data);
          console.log('Tool call completed:', data);
          addLog(`Tool call completed: ${data.id}`);
          setToolCalls(prev => prev.map(call =>
            call.id === data.id ? { 
              ...call, 
              output: JSON.stringify(data.output) 
            } : call
          ));
          setPendingToolCalls(prev => prev - 1);
        });

        eventSourceRef.current.addEventListener('end', () => {
          if (pendingToolCalls > 0) {
            setIsWaitingForToolCompletion(true);
          } else {
            finalizeMessage();
          }
        });

        eventSourceRef.current.onerror = () => {
          handleStreamError();
        };
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prev => [
          ...prev, 
          { id: Date.now(), text: "Sorry, there was an error processing your request.", sender: 'assistant' }
        ]);
        handleStreamError();
      }
      
      setUploadedFiles([]); // Clear uploaded files after sending the message
    }
  }, [isInitialized, isConversationStarted, addLog, pendingToolCalls, uploadedFiles]);

  const finalizeMessage = useCallback(() => {
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      return [
        ...prev.slice(0, -1),
        { ...lastMessage, isStreaming: false }
      ];
    });
    setIsStreaming(false);
    setIsToolCallInProgress(false);
    setIsWaitingForToolCompletion(false);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const handleStreamError = useCallback(() => {
    setIsStreaming(false);
    setIsToolCallInProgress(false);
    setIsWaitingForToolCompletion(false);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isWaitingForToolCompletion && pendingToolCalls === 0) {
      finalizeMessage();
    }
  }, [isWaitingForToolCompletion, pendingToolCalls, finalizeMessage]);
  
  const updateToolCallOutput = useCallback((toolCallId, output) => {
    setToolCalls(prev => prev.map(call => 
      call.id === toolCallId ? { ...call, output } : call
    ));
  }, []);

  const clearToolCalls = useCallback(() => {
    setToolCalls([]);
  }, []);

  const uploadFile = useCallback(async (file) => {
    if (!isInitialized || !isConversationStarted) {
      throw new Error('Assistant not initialized or conversation not started');
    }
  
    const formData = new FormData();
    formData.append('files', file);
  
    try {
      setUploadingFiles(prev => ({ ...prev, [file.name]: true }));
      addLog(`Uploading file: ${file.name}...`);
      const response = await axiosInstance.post('/api/chat/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      addLog(`File uploaded successfully: ${file.name}`);
      addServerLogs(response.data.logs);

      const uploadedFile = {
        ...response.data.files[0],
        size: file.size
      };

      setUploadingFiles(prev => {
        const newState = { ...prev };
        delete newState[file.name];
        return newState;
      });

      setUploadedFiles(prev => [...prev, uploadedFile]);

      return uploadedFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      addLog(`Error uploading file: ${file.name}`);
      setUploadingFiles(prev => {
        const newState = { ...prev };
        delete newState[file.name];
        return newState;
      });
      throw error;
    }
  }, [isInitialized, isConversationStarted, addLog, addServerLogs]);

  const removeUploadedFile = useCallback(async (fileId) => {
    try {
      addLog(`Removing file: ${fileId}...`);
      if (!fileId) {
        throw new Error('Invalid file ID');
      }
      await axiosInstance.delete(`/api/chat/files/${fileId}`);
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
      addLog(`File removed successfully: ${fileId}`);
    } catch (error) {
      console.error('Error removing file:', error);
      addLog(`Error removing file: ${fileId}`);
      throw error;
    }
  }, [addLog]);

  const endChat = useCallback(async () => {
    try {
      addLog('Ending chat...');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        addLog('Event stream closed');
      }
      const response = await axiosInstance.post('/api/chat/end');
      const data = response.data;
      setMessages([]);
      setIsInitialized(false);
      setIsConversationStarted(false);
      clearToolCalls();
      setIsStreaming(false);
      addLog('Chat ended successfully');
      addServerLogs(data.logs);
    } catch (error) {
      console.error('Error ending chat:', error);
      addLog('Error ending chat');
      throw error;
    }
  }, [addLog, addServerLogs, clearToolCalls]);

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
    uploadedFiles
  ]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};