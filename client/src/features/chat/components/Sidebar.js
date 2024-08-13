import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { styled } from '@mui/system';
import FormattedMessage from './FormattedMessage';
import { scrollbarStyles } from '../styles/chatStyles'; // Import scrollbarStyles

const SidebarContainer = styled(Box)(({ theme, isVisible }) => ({
  position: 'fixed', // Use fixed positioning for overlapping
  right: isVisible ? 10 : '-500px', // Move sidebar off-screen when hidden
  top: 100,
  width: '500px',
  height: '80%',
  backgroundColor: '#3f4150',
  color: '#ffffff',
  padding: theme.spacing(2),
  overflowY: 'auto',
  transition: 'right 0.3s ease-in-out', // Smooth transition
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
  borderRadius: '16px 16px 16px 16px',
  ...scrollbarStyles,
}));

const SubAssistantMessage = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1),
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: theme.shape.borderRadius,
}));

const Sidebar = ({ subAssistantMessages, isVisible }) => {
  return (
    <SidebarContainer isVisible={isVisible}>
      <Typography variant="h6" gutterBottom align="center">
        Sidebar
      </Typography>
      <Divider sx={{ marginBottom: 2 }} />
      {subAssistantMessages.length === 0 ? (
        <Typography variant="body2">No sub-assistant messages yet.</Typography>
      ) : (
        subAssistantMessages.map((message, index) => (
          <SubAssistantMessage key={index}>
            <Typography variant="subtitle2" gutterBottom>
              {message.subAssistantName}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Query: {message.query}
            </Typography>
            {message.response ? (
              <FormattedMessage content={message.response} isStreaming={false} isSidebar={true} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Waiting for response...
              </Typography>
            )}
          </SubAssistantMessage>
        ))
      )}
    </SidebarContainer>
  );
};

export default Sidebar;