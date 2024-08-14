import { styled, Box } from '@mui/material';

export const LayoutContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: '100vh',
  overflow: 'hidden',
  position: 'relative',
  backgroundColor: '#373944',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
  },
}));

export const WatchlistContainer = styled(Box)(({ theme }) => ({
  width: '400px',
  borderRight: '1px solid rgba(255, 255, 255, 0.12)',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    height: 'auto',
    borderRight: 'none',
    borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
  },
}));

export const ChatContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    height: 'calc(100% - 60px)', // Adjust this value based on your watchlist toggle button height
  },
}));