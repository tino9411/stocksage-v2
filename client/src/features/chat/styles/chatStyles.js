import { styled } from '@mui/system';
import { Box, TextField, Button, Fab, List, ListItem } from '@mui/material';

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

export const ThreadSidebar = styled(Box)(({ theme }) => ({
  width: '250px',
  height: '100%',
  backgroundColor: '#2e2e2e',
  color: '#ffffff',
  padding: theme.spacing(2),
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
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

export const ThreadList = styled(List)({
  flexGrow: 1,
  overflow: 'auto',
  padding: 0,
});

export const ThreadListItem = styled(ListItem)(({ theme, selected }) => ({
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(1),
  backgroundColor: selected ? '#4a4a4a' : 'transparent',
  '&:hover': {
    backgroundColor: '#3a3a3a',
  },
}));

export const CreateThreadButton = styled(Fab)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  backgroundColor: '#007bff',
  color: '#ffffff',
  '&:hover': {
    backgroundColor: '#0056b3',
  },
}));

export const ThreadSidebarHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
});

export const StyledThreadButton = styled(Button)(({ theme }) => ({
  color: '#ffffff',
  borderColor: '#ffffff',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));