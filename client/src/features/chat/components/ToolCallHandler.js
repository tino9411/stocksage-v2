import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
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
  const { toolCalls, isToolCallInProgress } = useChatState();

  if (toolCalls.length === 0 || !isToolCallInProgress) {
    return null;
  }

  return (
    <Box sx={{ 
      mt: 1, 
      mb: 1, 
      maxWidth: '800px', 
      width: '100%',
      margin: '0 auto',
      maxHeight: '200px',
      overflow: 'auto',
      border: '1px solid #444',
      borderRadius: 1,
      backgroundColor: '#2a2a2a',
      color: '#e0e0e0',
      ...scrollbarStyles,
    }}>
      <Box sx={{ minWidth: '100%', display: 'inline-block' }}>
        {toolCalls.map((toolCall, index) => (
          <Box key={toolCall.id} sx={{ 
            p: 1, 
            borderBottom: index < toolCalls.length - 1 ? '1px solid #444' : 'none',
          }}>
         
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, mb: 0.5, color: '#bbb' }}>
              <Box sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                <JSONPretty id={`json-pretty-${toolCall.id}`} data={JSON.parse(toolCall.function.arguments)} />
              </Box>
            </Typography>
            {toolCall.output === null ? (
              <LinearProgress sx={{ mt: 1, height: 2, backgroundColor: '#444', '& .MuiLinearProgress-bar': { backgroundColor: '#4a9eff' } }} />
            ) : (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#bbb' }}>
                Output: 
                <Box sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                  <JSONPretty id={`json-pretty-output-${toolCall.id}`} data={toolCall.output} />
                </Box>
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ToolCallHandler;