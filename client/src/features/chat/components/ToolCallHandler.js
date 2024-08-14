import React, { useEffect, useMemo } from 'react';
import { Box, Typography, LinearProgress, CircularProgress, useTheme } from '@mui/material';
import { useChatState } from '../../../features/chat';
import JSONPretty from 'react-json-pretty';
import 'react-json-pretty/themes/monikai.css';  // We will override these styles

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
  const theme = useTheme();  // Access the theme for consistent styling
  const { toolCalls, isToolCallInProgress, currentThreadId } = useChatState();

  const currentThreadToolCalls = useMemo(() => {
    return toolCalls.filter(call => {
      if (call.threadId !== currentThreadId) return false;
  
      if (call.type === 'function') {
        return call.function && call.function.arguments && call.function.arguments.trim() !== '{}';
      } else if (call.type === 'code_interpreter') {
        return call.code_interpreter && call.code_interpreter.input && call.code_interpreter.input.trim() !== '';
      }
      return false;
    });
  }, [toolCalls, currentThreadId]);

  const pendingToolCalls = useMemo(() => {
    return currentThreadToolCalls.filter(call => call.output === null).length;
  }, [currentThreadToolCalls]);

  useEffect(() => {
    console.log('ToolCallHandler state:', { currentThreadToolCalls, isToolCallInProgress, pendingToolCalls, currentThreadId });
  }, [currentThreadToolCalls, isToolCallInProgress, pendingToolCalls, currentThreadId]);

  useEffect(() => {
    if (currentThreadToolCalls.length > 0 || isToolCallInProgress) {
      console.log('ToolCallHandler triggering re-render');
    }
  }, [currentThreadToolCalls, isToolCallInProgress]);

  console.log('ToolCallHandler rendering');

  const safeJsonParse = (jsonString) => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      return jsonString;
    }
  };

  const renderToolCall = (toolCall) => {
    if (toolCall.type === 'function') {
      return (
        <>
          <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main }}>
            Function: {toolCall.function.name}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, mb: 0.5, color: theme.palette.text.secondary }}>
            Arguments:
            <Box sx={{ maxWidth: '100%', overflowX: 'auto', backgroundColor: theme.palette.background.paper, padding: theme.spacing(1), borderRadius: theme.shape.borderRadius }}>
              <JSONPretty
                data={safeJsonParse(toolCall.function.arguments || '{}')}
                theme={{
                  main: `background: none; color: ${theme.palette.text.primary};`,
                  key: `color: ${theme.palette.primary.main};`,
                  string: `color: ${theme.palette.secondary.main};`,
                  value: `color: ${theme.palette.info.main};`,
                  boolean: `color: ${theme.palette.success.main};`,
                  error: `color: ${theme.palette.error.main};`,
                }}
              />
            </Box>
          </Typography>
        </>
      );
    } else if (toolCall.type === 'code_interpreter') {
      return (
        <>
          <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main }}>
            Code Interpreter
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, mb: 0.5, color: theme.palette.text.secondary }}>
            Input:
            <Box sx={{ maxWidth: '100%', overflowX: 'auto', backgroundColor: theme.palette.background.paper, padding: theme.spacing(1), borderRadius: theme.shape.borderRadius }}>
              <pre style={{ margin: 0, color: theme.palette.text.primary }}>
                {toolCall.code_interpreter.input}
              </pre>
            </Box>
          </Typography>
        </>
      );
    }
  };

  return (
    <Box sx={{
      mt: 1, 
      mb: 1,
      maxWidth: '800px', 
      width: '100%',
      margin: '0 auto',
      maxHeight: '200px',
      overflow: 'auto',
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary,
      ...scrollbarStyles,
    }}>
      <Box sx={{ minWidth: '100%', display: 'inline-block' }}>
        {isToolCallInProgress && currentThreadToolCalls.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
            <CircularProgress size={24} sx={{ color: theme.palette.primary.main }} />
            <Typography variant="body2" sx={{ ml: 2 }}>Preparing tool call...</Typography>
          </Box>
        ) : (
          currentThreadToolCalls.map((toolCall, index) => (
            <Box key={toolCall.id} sx={{ 
              p: 1, 
              borderBottom: index < currentThreadToolCalls.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
            }}>
              {renderToolCall(toolCall)}
              {toolCall.output === null ? (
                <Box>
                  <LinearProgress sx={{ mt: 1, height: 2, backgroundColor: theme.palette.background.paper, '& .MuiLinearProgress-bar': { backgroundColor: theme.palette.primary.main } }} />
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: theme.palette.text.secondary }}>
                    Processing...
                  </Typography>
                </Box>
              ) : (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: theme.palette.text.secondary }}>
                  Output: 
                  <Box sx={{ maxWidth: '100%', overflowX: 'auto', backgroundColor: theme.palette.background.paper, padding: theme.spacing(1), borderRadius: theme.shape.borderRadius }}>
                    <JSONPretty
                      data={safeJsonParse(toolCall.output)}
                      theme={{
                        main: `background: none; color: ${theme.palette.text.primary};`,
                        key: `color: ${theme.palette.primary.main};`,
                        string: `color: ${theme.palette.secondary.main};`,
                        value: `color: ${theme.palette.info.main};`,
                        boolean: `color: ${theme.palette.success.main};`,
                        error: `color: ${theme.palette.error.main};`,
                      }}
                    />
                  </Box>
                </Typography>
              )}
            </Box>
          ))
        )}
        {pendingToolCalls > 0 && (
          <Box sx={{ p: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Pending tool calls: {pendingToolCalls}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ToolCallHandler;