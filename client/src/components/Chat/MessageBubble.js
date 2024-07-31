import React, { useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/system';
import FormattedMessage from './FormattedMessage';
import CopyButton from './CopyButton';

const StyledMessageBubble = styled(Box)(({ theme, isuser }) => ({
  backgroundColor: isuser ? '#5a8dee' : '#424557',
  borderRadius: '18px',
  padding: theme.spacing(1, 2),
  maxWidth: '100%',
  wordWrap: 'break-word',
  '& pre': {
    backgroundColor: '#2a2a2a',
    borderRadius: '4px',
    padding: theme.spacing(1),
    overflow: 'auto',
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#3d3d3d',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: '#555',
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'transparent',
    },
  },
  '& table': {
    width: '100%',
    borderCollapse: 'collapse',
  },
  '& th, & td': {
    border: '1px solid #4d4d4d',
    padding: theme.spacing(0.5),
  },
  '& ul, & ol': {
    marginLeft: theme.spacing(3),
  },
  '& li': {
    marginBottom: theme.spacing(1),
  },
  position: 'relative',
}));

function MessageBubble({ message }) {
  const [showCopyButton, setShowCopyButton] = useState(false);

  const handleMouseEnter = useCallback(() => setShowCopyButton(true), []);
  const handleMouseLeave = useCallback(() => setShowCopyButton(false), []);

  return (
    <Box
      sx={{ position: 'relative', marginBottom: 2 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <StyledMessageBubble isuser={message.sender === 'user'}>
        {message.sender === 'user' ? (
          <Typography variant="body1">{message.text}</Typography>
        ) : (
          <FormattedMessage content={message.text} isStreaming={message.isStreaming} />
        )}
      </StyledMessageBubble>
      {showCopyButton && !message.isStreaming && (
        <Box sx={{ position: 'relative', top: 0, right: 0 }}>
          <CopyButton text={message.text} />
        </Box>
      )}
    </Box>
  );
}

export default React.memo(MessageBubble);