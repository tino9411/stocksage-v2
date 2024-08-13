import { styled, keyframes } from '@mui/system';
import { Box, TextField, Button, Fab, IconButton, Popper, Paper, Table } from '@mui/material';

// Common styles
export const scrollbarStyles = {
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: (theme) => theme.palette.divider,
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: (theme) => theme.palette.text.secondary,
    },
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
};

export const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '2000px',  // Consistent fixed width
  backgroundColor: '#373944',
  color: theme.palette.text.primary,
  overflow: 'hidden',
  margin: '0 auto',  // Center the container horizontally
  minWidth: '100%',  // Prevent overflow on smaller screens
  maxWidth: '100%',  // Ensure it doesn't exceed 100% of the viewport width
}));

export const ChatLayout = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  height: '100%',
  width: '100%',
  overflow: 'hidden',
});

export const ChatBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSidebarVisible',
})(({ theme, isSidebarVisible }) => ({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#373944',
  color: theme.palette.text.primary,
  padding: theme.spacing(2),
  overflow: 'auto',
  marginRight:'auto', // Shift the content left when the sidebar is visible
  maxWidth:  '70%', // Set max-width for when sidebar is hidden
  marginLeft: 'auto', // Center the chatbox when sidebar is not visible
}));

// New SidebarToggleButton styles
export const SidebarToggleButton = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSidebarVisible',
})(({ theme, isSidebarVisible }) => ({
  position: 'absolute',
  right: isSidebarVisible ? '500px' : '0',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 1200,
  transition: 'right 0.3s ease-in-out',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '50%',
  boxShadow: theme.shadows[3],
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

// MessageList styles
export const MessageList = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  ...scrollbarStyles,
}));

// InputArea styles
export const InputArea = styled(Box)(({ theme }) => ({
  width: '90%',
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  margin: '0 auto',
}));

export const FullWidthBox = styled(Box)({
  display: 'flex',
  width: '100%',
});

// InputArea styles
export const CommandPopper = styled(Popper)(({ theme }) => ({
  zIndex: 1300,
  width: 'calc(100% - 32px)',
  maxWidth: '350px',
  marginBottom: '10px',
  '& .MuiPaper-root': {
    backgroundColor: '#373944',
    color: theme.palette.text.primary,
    borderRadius: '0px',
    maxHeight: '200px',
    overflowY: 'auto',
    border: `2px solid ${theme.palette.divider}`,
    '&::-webkit-scrollbar': {
      width: '4px',
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
  },
}));

export const CommandItem = styled('div')(({ theme, isSelected }) => ({
  padding: '6px 12px',
  cursor: 'pointer',
  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

// StyledTextField styles
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

// StyledButton styles
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

// ScrollToBottomFab styles
export const ScrollToBottomFab = styled(Fab)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
}));

// Header styles
export const Header = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

// FilePreviewComponent styles
export const FilePreviewContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: '#373944',
  borderRadius: '4px 4px 0 0',
}));

export const FilePreview = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#373944',
  borderRadius: '4px',
  padding: theme.spacing(1),
  width: '150px',
  height: '80px',
}));

export const FileIconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '40px',
}));

export const FileNameWrapper = styled(Box)({
  width: '100%',
  textAlign: 'center',
  overflow: 'wrap',
});

export const RemoveFileButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  padding: 2,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

export const LoadingOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  borderRadius: '4px',
});

// FormattedMessage styles
export const StyledTable = styled(Table)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& th, & td': {
    borderColor: '#4d4d4d',
    padding: theme.spacing(1),
    fontSize: '0.875rem',
  },
}));

export const CodeHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.grey[800],
  borderTopLeftRadius: theme.shape.borderRadius,
  borderTopRightRadius: theme.shape.borderRadius,
}));

export const CodeBlock = styled(Box)(({ theme }) => ({
  margin: 0,
  padding: 0,
  overflow: 'auto',
  borderRadius: '4px',
  '& pre': {
    margin: 0,
    padding: '16px',
    overflowX: 'auto',
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
  },
}));

export const blink = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 1; }
`;

export const BlinkingCursor = styled('span')({
  animation: `${blink} 1s step-end infinite`,
  display: 'inline-block',
  marginLeft: '1px',
});