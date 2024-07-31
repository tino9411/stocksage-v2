//client/src/styles/chatStyles.js
import { styled } from '@mui/system';
import { Box, TextField, Button, Fab } from '@mui/material';

export const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: '#373944',
  color: theme.palette.text.primary,
  alignItems: 'center',
  justifyContent: 'center',
}));

export const ChatBox = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '900px',
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: '#373944',
  color: theme.palette.text.primary,
  transform: 'scale(0.95)',
}));

export const StyledTextField = styled(TextField)(({ theme }) => ({
  flexGrow: 1,
  marginRight: theme.spacing(2),
  '& .MuiInputBase-root': {
    color: theme.palette.text.primary,
    backgroundColor: '#373944',
    borderRadius: '20px',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.divider,
    borderRadius: '20px',
  },
}));

export const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  minWidth: '40px',
  height: '40px',
  borderRadius: '50%',
  padding: '0',
  marginLeft: theme.spacing(1),
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

export const MessageList = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.divider,
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: theme.palette.text.secondary,
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
}));

export const InputArea = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'flex-end',
}));

export const ScrollToBottomFab = styled(Fab)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
}));