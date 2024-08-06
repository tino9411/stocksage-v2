import React, { useRef, useEffect, useCallback } from 'react';
import { List, ListItem, Box, Typography } from '@mui/material';
import { useChatState } from '../../../features/chat';
import MessageBubble from './MessageBubble';
import { MessageList as StyledMessageList } from '../styles/chatStyles';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { styled } from '@mui/system';

const FileDisplay = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '4px',
  marginBottom: theme.spacing(1),
}));

const FileItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

function MessageList() {
  const { messages, isStreaming } = useChatState();
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isStreaming) {
      scrollToBottom();
    }
  }, [messages, isStreaming, scrollToBottom]);

  const formatFileSize = (bytes) => {
    if (isNaN(bytes) || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <StyledMessageList component={List}>
      {messages.map((message, index) => (
  <ListItem
    key={message.id || index}
          style={{ justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start', flexDirection: 'column', alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start' }}
        >
          {message.type === 'files' ? (
            <FileDisplay>
              {message.files.map((file, index) => (
                <FileItem key={index}>
                  <AttachFileIcon fontSize="small" />
                  <Typography variant="body2">
                    {file.name} ({formatFileSize(file.size)})
                  </Typography>
                </FileItem>
              ))}
            </FileDisplay>
          ) : (
            <MessageBubble message={message} />
          )}
        </ListItem>
      ))}
      <div ref={messagesEndRef} />
    </StyledMessageList>
  );
}

export default React.memo(MessageList);