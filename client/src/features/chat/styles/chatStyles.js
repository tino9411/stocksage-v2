import { styled } from '@mui/system';
import { Box, TextField, Button, Fab } from '@mui/material';

// Container for the entire chat interface
export const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: '#373944',
  color: theme.palette.text.primary,
  alignItems: 'center',
  justifyContent: 'center',
}));

// Layout for the chat interface with a sidebar
export const ChatLayout = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  height: '100%',
  width: '100%',  // Added width to ensure it stretches to full width
});

// Sidebar for displaying threads
export const Sidebar = styled(Box)({
  width: '300px',
  backgroundColor: '#2e2e2e',
  color: 'white',
  padding: '10px',
  overflowY: 'auto',
});

// Chat box where the messages and input area are displayed
export const ChatBox = styled(Box)(({ theme }) => ({
  flexGrow: 1, // Ensure the chat box takes up remaining space
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#373944',
  color: theme.palette.text.primary,
  padding: theme.spacing(2),
}));

// Styled text field for message input
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

// Styled button for sending messages
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

// List of messages with scrollable behavior
export const MessageList = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
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

// Container for the input area
export const InputArea = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'flex-end',
}));

// Floating action button for scrolling to the bottom of the chat
export const ScrollToBottomFab = styled(Fab)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
}));