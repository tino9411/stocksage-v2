import React from 'react';
import { useWatchlist } from '../hooks/useWatchlist';
import { WatchlistContext } from './WatchlistContext';

export const WatchlistProvider = ({ children }) => {
  const watchlistData = useWatchlist();

  return (
    <WatchlistContext.Provider value={watchlistData}>
      {children}
    </WatchlistContext.Provider>
  );
};