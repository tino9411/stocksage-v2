import React, { useEffect } from 'react';
import { Box, styled, CircularProgress } from '@mui/material';
import { Watchlist } from '../features/watchlist';
import Chat from '../features/chat/components/Chat';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

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

const LoadingContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
});

function MainLayout() {
  const { user, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <LoadingContainer>
        <CircularProgress />
      </LoadingContainer>
    );
  }

  if (!user) {
    return null; // This will prevent any flash of content before redirecting
  }

  return (
    <LayoutContainer>
      <WatchlistContainer>
        <Watchlist />
      </WatchlistContainer>
      <ChatContainer>
        <Chat />
      </ChatContainer>
    </LayoutContainer>
  );
}

export default MainLayout;