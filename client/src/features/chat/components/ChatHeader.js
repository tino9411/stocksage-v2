import React, { useState } from 'react';
import { Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EndChatDialog from './EndChatDialog';
import { styled } from '@mui/system';
import CloseIcon from '@mui/icons-material/Close';

const Header = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

function ChatHeader({ onEndChat }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleEndChat = () => {
    setDialogOpen(true);
  };

  const confirmEndChat = () => {
    onEndChat();
    setDialogOpen(false);
  };

  return (
    <Header>
      <IconButton edge="start" color="inherit" aria-label="back">
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h6">Stock Sage</Typography>
      <IconButton color="inherit" onClick={handleEndChat}>
        <CloseIcon />
      </IconButton>
      <EndChatDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={confirmEndChat}
      />
    </Header>
  );
}

export default ChatHeader;