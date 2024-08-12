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
  };
};