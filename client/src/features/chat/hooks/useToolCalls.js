import { useState, useCallback } from 'react';

export const useToolCalls = () => {
  const [toolCalls, setToolCalls] = useState([]);
  const [isToolCallInProgress, setIsToolCallInProgress] = useState(false);
  const [pendingToolCalls, setPendingToolCalls] = useState(0);
  const [isWaitingForToolCompletion, setIsWaitingForToolCompletion] = useState(false);

  const updateToolCallOutput = useCallback((toolCallId, output) => {
    setToolCalls(prev => prev.map(call => 
      call && call.id === toolCallId ? { ...call, output } : call
    ));
  }, []);

  const clearToolCalls = useCallback(() => {
    setToolCalls([]);
  }, []);

  // New function to safely add a tool call
  const addToolCall = useCallback((newToolCall) => {
    if (newToolCall && typeof newToolCall === 'object') {
      setToolCalls(prev => [...prev, newToolCall]);
    } else {
      console.error('Attempted to add invalid tool call:', newToolCall);
    }
  }, []);

  return {
    toolCalls,
    setToolCalls,
    isToolCallInProgress,
    setIsToolCallInProgress,
    pendingToolCalls,
    setPendingToolCalls,
    isWaitingForToolCompletion,
    setIsWaitingForToolCompletion,
    updateToolCallOutput,
    clearToolCalls,
    addToolCall,
  };
};