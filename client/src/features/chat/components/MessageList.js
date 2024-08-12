import React, { useRef, useEffect, useCallback } from 'react';
import { List, ListItem, Box, Typography } from '@mui/material';
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

function MessageList({ messages, currentThreadId }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    console.log("Messages in MessageList:", messages);
    console.log("Current Thread ID:", currentThreadId);
  }, [messages, currentThreadId]);

  const formatFileSize = (bytes) => {
    if (isNaN(bytes) || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter messages for the current thread
  const currentThreadMessages = messages.filter(message => message.threadId === currentThreadId);

  console.log("Rendering messages:", currentThreadMessages);

  if (currentThreadMessages.length === 0) {
    return <Typography>No messages in this thread yet.</Typography>;
  }

  return (
    <StyledMessageList component={List}>
      {currentThreadMessages.map((message, index) => (
        <ListItem
          key={message.id || index}
          style={{ 
            justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start', 
            flexDirection: 'column', 
            alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start' 
          }}
        >
          {message.type === 'files' ? (
            <FileDisplay>
              {message.files.map((file, fileIndex) => (
                <FileItem key={fileIndex}>
                  <AttachFileIcon fontSize="small" />
                  <Typography variant="body2">
                    {file.name} ({formatFileSize(file.size)})
                  </Typography>
                </FileItem>
              ))}
            </FileDisplay>
          ) : (
            <MessageBubble message={message} currentThreadId={currentThreadId} />
          )}
        </ListItem>
      ))}
      <div ref={messagesEndRef} />
    </StyledMessageList>
  );
}

export default React.memo(MessageList);