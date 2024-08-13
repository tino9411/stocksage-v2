import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { styled } from '@mui/system';
import FormattedMessage from './FormattedMessage';

const SidebarContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  right: 0,
  top: 100,
  width: '300px',
  height: '80%',
  backgroundColor: '#3f4150',
  color: '#ffffff',
  padding: theme.spacing(2),
  overflowY: 'auto',
  transition: 'transform 0.3s ease-in-out',
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
  borderRadius: '16px 0 0 16px',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#4a4a4a',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: '#5a5a5a',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
}));

const SubAssistantMessage = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1),
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: theme.shape.borderRadius,
}));

const Sidebar = ({ subAssistantMessages, isVisible }) => {
  console.log('Rendering Sidebar with messages:', subAssistantMessages);

  return (
    <SidebarContainer style={{ transform: isVisible ? 'translateX(0)' : 'translateX(100%)' }}>
      <Typography variant="h6" gutterBottom align="center">
        Sub-Assistant Interactions
      </Typography>
      <Divider sx={{ marginBottom: 2 }} />
      {subAssistantMessages.length === 0 ? (
        <Typography variant="body2">No sub-assistant messages yet.</Typography>
      ) : (
        subAssistantMessages.map((message, index) => {
          console.log('Rendering message:', message);
          return (
            <SubAssistantMessage key={index}>
              <Typography variant="subtitle2" gutterBottom>
                {message.subAssistantName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Query: {message.query}
              </Typography>
              {message.response ? (
                <FormattedMessage content={message.response} isStreaming={false} />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Waiting for response...
                </Typography>
              )}
            </SubAssistantMessage>
          );
        })
      )}
    </SidebarContainer>
  );
};

export default Sidebar;