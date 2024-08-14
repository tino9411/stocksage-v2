import { styled, keyframes } from '@mui/system';
import { Box, TextField, Button, Fab, IconButton, Popper, Paper, Table, List, ListItem, Typography } from '@mui/material';


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
  width: '100%',
  backgroundColor: '#373944',
  color: theme.palette.text.primary,
  overflow: 'hidden',
  margin: '0 auto',
  boxSizing: 'border-box',

  // Base styles for smaller screens
  padding: theme.spacing(1),
  minWidth: '300px',

  // Medium screens
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(2),
    maxWidth: '1200px',
  },

  // Large screens
  [theme.breakpoints.up('lg')]: {
    padding: theme.spacing(3),
  },

  // Very large screens
  [theme.breakpoints.up('xl')]: {
    maxWidth: '1400px',
  },

  // Flexible sizing for height on smaller screens or when height is constrained
  [theme.breakpoints.down('sm')]: {
    height: 'auto',
    minHeight: '100vh',
  },
}));

export const ChatLayout = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  height: '100%',
  width: '100%',
  overflow: 'hidden',

  // Stack vertically on mobile
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
  },
}));

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
  marginRight: 'auto',
  marginLeft: 'auto',
  width: '100%',
  maxWidth: '800px',
  minWidth: '280px',

  // Responsive adjustments
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    minWidth: '100%',
    padding: theme.spacing(1),
    paddingBottom: '80px', // Add padding to account for fixed input area
  },
  [theme.breakpoints.up('sm')]: {
    width: '80%',
    minWidth: '400px',
  },
  [theme.breakpoints.up('md')]: {
    width: '60%',
    minWidth: '500px',
  },
  [theme.breakpoints.up('lg')]: {
    width: '40%',
    minWidth: '600px',
  },
}));


// MessageList styles
export const MessageList = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  ...scrollbarStyles,

  // Adjust padding for mobile
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    paddingBottom: '80px', // Add padding to account for fixed input area
  },
}));

// InputArea styles
export const InputArea = styled(Box)(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  boxSizing: 'border-box',
  margin: '0 auto',

  // Adjust padding and position for mobile
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#373944',
    borderTop: `1px solid ${theme.palette.divider}`,
    zIndex: 1000,
  },
}));

// New ButtonContainer styles
export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginLeft: theme.spacing(1),

  [theme.breakpoints.down('sm')]: {
    marginLeft: 0,
    marginTop: theme.spacing(1),
    justifyContent: 'space-between',
  },
}));

export const FullWidthBox = styled(Box)({
  display: 'flex',
  width: '100%',
});

// CommandPopper styles
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
    ...scrollbarStyles,
  },

  // Adjust width for mobile
  [theme.breakpoints.down('sm')]: {
    width: 'calc(100% - 16px)',
    maxWidth: 'none',
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

  // Adjust margin for mobile
  [theme.breakpoints.down('sm')]: {
    marginRight: 0,
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
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },

  // Adjust size for mobile
  [theme.breakpoints.down('sm')]: {
    width: '36px',
    height: '36px',
  },
}));

// ScrollToBottomFab styles
export const ScrollToBottomFab = styled(Fab)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  right: theme.spacing(2),

  // Adjust position for mobile
  [theme.breakpoints.down('sm')]: {
    bottom: theme.spacing(1),
    right: theme.spacing(1),
  },
}));

// Header styles
export const Header = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',

  // Adjust padding for mobile
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
  },
}));

// FilePreviewComponent styles
export const FilePreviewContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: '#373944',
  borderRadius: '4px 4px 0 0',

  // Adjust gap for mobile
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(0.5),
  },
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

  // Adjust size for mobile
  [theme.breakpoints.down('sm')]: {
    width: '120px',
    height: '70px',
  },
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

export const ThreadSidebar = styled(Box)(({ theme }) => ({
  flexBasis: '250px',
  flexShrink: 0,
  flexGrow: 0,
  minWidth: '200px',
  maxWidth: '300px',
  height: '100%',
  backgroundColor: '#2e2e2e',
  color: '#ffffff',
  padding: theme.spacing(2),
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  transition: 'flex-basis 0.3s ease',

  [theme.breakpoints.down('sm')]: {
    flexBasis: '100%',
    maxWidth: '100%',
    height: 'auto',
    maxHeight: '200px',
    minWidth: '100%',
  },

  [theme.breakpoints.between('sm', 'md')]: {
    flexBasis: '200px',
  },

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
  position: 'relative',
  padding: theme.spacing(1, 2),
  cursor: 'pointer',
  '&:hover .delete-button': {
    opacity: 1,
  },
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
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

export const ThreadTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  marginBottom: theme.spacing(0.5),
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  width: '100%',
  fontSize: '0.8rem',
  lineHeight: 1.2,
}));

export const ThreadInfo = styled(Typography)(({ theme }) => ({
  fontSize: '0.65rem',
  color: theme.palette.text.secondary,
  width: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

export const DeleteButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  top: theme.spacing(1),
  opacity: 0,
  transition: 'opacity 0.2s',
  color: theme.palette.error.main,
  padding: theme.spacing(0.5),
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

export const ThreadListItemContent = styled(Box)({
  flexGrow: 1,
  overflow: 'hidden',
  width: '100%',
});

// Sidebar styles
export const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const SidebarContainer = styled(Box)(({ theme, isVisible }) => ({
  position: 'fixed',
  right: isVisible ? 10 : '-100%',
  top: 70,
  width: '500px',
  height: '90%',
  backgroundColor: '#3f4150',
  color: '#ffffff',
  transition: 'right 0.3s ease-in-out',
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
  borderRadius: '20px 20px',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1200,

  [theme.breakpoints.down('sm')]: {
    width: '100%',
    right: isVisible ? 0 : '-100%',
  },
}));

export const SidebarHeader = styled(Box)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  backgroundColor: '#3f4150',
  borderRadius: '20px 20px 0px 0px',
  zIndex: 1,
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const SidebarMessageArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  ...scrollbarStyles,
}));

export const SidebarMessageBox = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  animation: `${fadeIn} 0.5s ease-in-out`,
}));

export const SidebarMessageBubble = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: '12px',
  backgroundColor: '#424557',
  color: '#ffffff',
}));

export const SidebarMessageSender = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  color: theme.palette.secondary.light,
  marginBottom: theme.spacing(0.5),
}));

export const SidebarToggleButton = styled(IconButton)(({ theme, isVisible }) => ({
  position: 'fixed',
  top: '50%',
  right: isVisible ? '500px' : 0,
  transform: 'translateY(-50%)',
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  zIndex: 1300,
  transition: 'right 0.1s ease-in-out',

  [theme.breakpoints.down('sm')]: {
    top: 'auto',
    bottom: theme.spacing(2),
    right: isVisible ? 'calc(100% - 48px)' : 0,
    transform: 'none',
  },
}));