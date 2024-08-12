import { styled } from '@mui/system';
import { Box, List, ListItem, Fab, IconButton, Typography, Button } from '@mui/material';

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