import React from 'react';
import { WatchlistProvider } from '../contexts/WatchlistProvider';
import WatchlistContainer from './WatchlistContainer';

const Watchlist = () => (
  <WatchlistProvider>
    <WatchlistContainer />
  </WatchlistProvider>
);

export default Watchlist;
