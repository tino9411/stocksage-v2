//client/src/components/chat/EndChatDialog.js
import React from 'react';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';

function EndChatDialog({ open, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>End Chat</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to end this chat? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="primary">
          End Chat
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EndChatDialog;