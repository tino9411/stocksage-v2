import React, { useEffect, useMemo } from 'react';
import { Box, Typography, LinearProgress, CircularProgress } from '@mui/material';
import { useChatState } from '../../../features/chat';
import JSONPretty from 'react-json-pretty';
import 'react-json-pretty/themes/monikai.css';

const scrollbarStyles = {
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#2a2a2a',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#555',
    borderRadius: '4px',
    '&:hover': {
      background: '#777',
    },
  },
  scrollbarWidth: 'thin',
  scrollbarColor: '#555 #2a2a2a',
};

const ToolCallHandler = () => {
  const { toolCalls, isToolCallInProgress, currentThreadId } = useChatState();

  // Filter tool calls for the current thread and remove entries without arguments
  const currentThreadToolCalls = useMemo(() => {
    return toolCalls
      .filter(call => call.threadId === currentThreadId)
      .filter(call => call.function && call.function.arguments && call.function.arguments.trim() !== '');
  }, [toolCalls, currentThreadId]);

  // Calculate pending tool calls
  const pendingToolCalls = useMemo(() => {
    return currentThreadToolCalls.filter(call => call.output === null).length;
  }, [currentThreadToolCalls]);

  useEffect(() => {
    console.log('ToolCallHandler state:', { currentThreadToolCalls, isToolCallInProgress, pendingToolCalls, currentThreadId });
  }, [currentThreadToolCalls, isToolCallInProgress, pendingToolCalls, currentThreadId]);

  if (!isToolCallInProgress && currentThreadToolCalls.length === 0) {
    console.log('ToolCallHandler not rendering: no active tool calls for current thread');
    return null;
  }

  console.log('ToolCallHandler rendering');

  const safeJsonParse = (jsonString) => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      return jsonString; // Return the original string if parsing fails
    }
  };

  return (
    <Box sx={{ 
      mt: 1, 
      mb: 1, 
      maxWidth: '800px', 
      width: '100%',
      margin: '0 auto',
      maxHeight: '400px',
      overflow: 'auto',
      border: '1px solid #444',
      borderRadius: 1,
      backgroundColor: '#2a2a2a',
      color: '#e0e0e0',
      ...scrollbarStyles,
    }}>
      <Box sx={{ minWidth: '100%', display: 'inline-block' }}>
        {isToolCallInProgress && currentThreadToolCalls.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
            <CircularProgress size={24} sx={{ color: '#4a9eff' }} />
            <Typography variant="body2" sx={{ ml: 2 }}>Preparing tool call...</Typography>
          </Box>
        ) : (
          currentThreadToolCalls.map((toolCall, index) => (
            <Box key={toolCall.id} sx={{ 
              p: 1, 
              borderBottom: index < currentThreadToolCalls.length - 1 ? '1px solid #444' : 'none',
            }}>
              <Typography variant="subtitle2" sx={{ color: '#4a9eff' }}>
                Tool: {toolCall.function.name}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, mb: 0.5, color: '#bbb' }}>
                Arguments:
                <Box sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                  <JSONPretty id={`json-pretty-${toolCall.id}`} data={safeJsonParse(toolCall.function.arguments)} />
                </Box>
              </Typography>
              {toolCall.output === null ? (
                <Box>
                  <LinearProgress sx={{ mt: 1, height: 2, backgroundColor: '#444', '& .MuiLinearProgress-bar': { backgroundColor: '#4a9eff' } }} />
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#bbb' }}>
                    Processing...
                  </Typography>
                </Box>
              ) : (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#bbb' }}>
                  Output: 
                  <Box sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                    <JSONPretty id={`json-pretty-output-${toolCall.id}`} data={safeJsonParse(toolCall.output)} />
                  </Box>
                </Typography>
              )}
            </Box>
          ))
        )}
        {pendingToolCalls > 0 && (
          <Box sx={{ p: 1, borderTop: '1px solid #444' }}>
            <Typography variant="caption" sx={{ color: '#bbb' }}>
              Pending tool calls: {pendingToolCalls}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ToolCallHandler;