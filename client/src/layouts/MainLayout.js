import React from 'react';
import { Watchlist } from '../features/watchlist';
import Chat from '../features/chat/components/Chat';
import { useRequireAuth } from '../hooks/useRequireAuth';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { LayoutContainer, WatchlistContainer, ChatContainer } from './styles/MainLayoutStyles';

function MainLayout() {
  const { loading, user } = useRequireAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
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
