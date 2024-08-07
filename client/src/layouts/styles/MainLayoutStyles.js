import { styled, Box } from '@mui/material';

export const LayoutContainer = styled(Box)({
  display: 'flex',
  height: '100vh',
  overflow: 'hidden',
});

export const WatchlistContainer = styled(Box)({
  width: '400px',
  borderRight: '1px solid rgba(255, 255, 255, 0.12)',
});

export const ChatContainer = styled(Box)({
  flexGrow: 1,
  overflow: 'auto',
});
