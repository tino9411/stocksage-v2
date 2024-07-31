import React from 'react';
import { Box, styled } from '@mui/material';
import WatchlistComponent from './Watchlist/Watchlist';
import Chat from './Chat/Chat';
import LoginButton from './LoginButton';
import { useUser } from '../contexts/UserContext';

const LayoutContainer = styled(Box)({
  display: 'flex',
  height: '100vh',
  overflow: 'hidden',
});

const WatchlistContainer = styled(Box)({
  width: '400px',
  borderRight: '1px solid rgba(255, 255, 255, 0.12)',
});

const ChatContainer = styled(Box)({
  flexGrow: 1,
  overflow: 'auto',
});

const LoginContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
});

function MainLayout() {
  const { user, loading } = useUser();

  if (loading) {
    return <Box>Loading...</Box>;
  }

  if (!user) {
    return (
      <LoginContainer>
        <LoginButton />
      </LoginContainer>
    );
  }

  return (
    <LayoutContainer>
      <WatchlistContainer>
        <WatchlistComponent />
      </WatchlistContainer>
      <ChatContainer>
        <Chat />
      </ChatContainer>
    </LayoutContainer>
  );
}

export default MainLayout;