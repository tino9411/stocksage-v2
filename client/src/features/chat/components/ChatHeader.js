import React, { useState } from 'react';
import { Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EndChatDialog from './EndChatDialog';
import CloseIcon from '@mui/icons-material/Close';
import { Header } from '../styles/chatStyles';  // Import the Header component from chatStyles

function ChatHeader({ onEndChat, currentThreadId, onBackClick }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleEndChat = () => {
    setDialogOpen(true);
  };

  const confirmEndChat = () => {
    onEndChat(currentThreadId);
    setDialogOpen(false);
  };

  return (
    <Header>
      <IconButton edge="start" color="inherit" aria-label="back" onClick={onBackClick}>
        <ArrowBackIcon />
      </IconButton>
      {currentThreadId && (
        <IconButton color="inherit" onClick={handleEndChat}>
          <CloseIcon />
        </IconButton>
      )}
      <EndChatDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={confirmEndChat}
      />
    </Header>
  );
}

export default ChatHeader;