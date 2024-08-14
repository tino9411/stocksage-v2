import React from 'react';
import { Typography } from '@mui/material';
import FormattedMessage from './FormattedMessage';
import {
  SidebarContainer,
  SidebarHeader,
  SidebarMessageArea,
  SidebarMessageBox,
  SidebarMessageBubble,
  SidebarMessageSender
} from '../styles/chatStyles';

const Sidebar = ({ subAssistantMessages, isVisible }) => {
  return (
    <SidebarContainer isVisible={isVisible}>
      <SidebarHeader>
        <Typography variant="h6" gutterBottom align="center">
          Sidebar
        </Typography>
      </SidebarHeader>
      <SidebarMessageArea>
        {subAssistantMessages.length === 0 ? (
          <Typography variant="body2">No sub-assistant messages yet.</Typography>
        ) : (
          subAssistantMessages.map((message, index) => (
            <React.Fragment key={index}>
              <SidebarMessageBox>
                <SidebarMessageBubble>
                  <SidebarMessageSender>Stock Sage</SidebarMessageSender>
                  <Typography variant="body2">{message.query}</Typography>
                </SidebarMessageBubble>
              </SidebarMessageBox>
              <SidebarMessageBox>
                <SidebarMessageBubble>
                  <SidebarMessageSender>{message.subAssistantName}</SidebarMessageSender>
                  {message.response ? (
                    <FormattedMessage content={message.response} isStreaming={false} isSidebar={true} />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Waiting for response...
                    </Typography>
                  )}
                </SidebarMessageBubble>
              </SidebarMessageBox>
            </React.Fragment>
          ))
        )}
      </SidebarMessageArea>
    </SidebarContainer>
  );
};

export default Sidebar;