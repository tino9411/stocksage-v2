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

  const renderContent = () => {
    if (typeof message.text === 'string') {
      return message.sender === 'user' ? (
        <Typography variant="body1">{message.text}</Typography>
      ) : (
        <FormattedMessage content={message.text} isStreaming={message.isStreaming} />
      );
    } else if (Array.isArray(message.content)) {
      return message.content.map((item, index) => {
        if (item.type === 'text') {
          return <FormattedMessage key={index} content={item.value} isStreaming={message.isStreaming} />;
        } else if (item.type === 'image') {
          return <img key={index} src={item.url} alt="Generated by AI" style={{ maxWidth: '100%', height: 'auto' }} />;
        }
        return null;
      });
    }
    return null;
  };

  return (
    <Box
      sx={{ position: 'relative', marginBottom: 2 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <StyledMessageBubble isuser={message.sender === 'user'}>
        {renderContent()}
      </StyledMessageBubble>
      {showCopyButton && !message.isStreaming && (
        <Box sx={{ position: 'relative', top: 0, right: 0 }}>
          <CopyButton text={typeof message.text === 'string' ? message.text : JSON.stringify(message.content)} />
        </Box>
      )}
    </Box>
  );
}

export default React.memo(MessageBubble);