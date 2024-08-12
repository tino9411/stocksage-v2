import { useCallback, useRef } from 'react';

export const useEventSource = (
  addLog,
  setIsToolCallInProgress,
  setMessages,
  setToolCalls,
  setPendingToolCalls,
  finalizeMessage,
  handleStreamError
) => {
  const eventSourceRef = useRef(null);

  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const setupEventSource = useCallback((url) => {
    closeEventSource(); // Close any existing EventSource before creating a new one

    try {
      eventSourceRef.current = new EventSource(url);
    } catch (error) {
      console.error('Error setting up EventSource:', error);
      throw new Error('Failed to establish streaming connection');
    }

    eventSourceRef.current.onerror = (event) => {
      console.error('EventSource failed:', event);
      if (typeof handleStreamError === 'function') {
        handleStreamError();
      } else {
        console.error('handleStreamError is not a function');
      }
      closeEventSource();
    };

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
              text: (lastMessage?.text || '') + data.content,
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
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        return [
          ...prev.slice(0, -1),
          { ...lastMessage, isStreaming: false }
        ];
      });
      finalizeMessage();
      closeEventSource();
    });
  }, [addLog, setIsToolCallInProgress, setMessages, setToolCalls, setPendingToolCalls, finalizeMessage, handleStreamError, closeEventSource]);

  return { setupEventSource, closeEventSource, eventSourceRef };
};