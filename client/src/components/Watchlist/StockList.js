import React from 'react';
import { List, Typography } from '@mui/material';
import { styled } from '@mui/system';
import StockItem from './StockItem';

const StockListContainer = styled(List)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
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
}));

const StockList = ({ filteredWatchlist, removeFromWatchlist }) => (
  <StockListContainer>
    {filteredWatchlist.length === 0 ? (
      <Typography>No stocks found. Try a different search term or add new stocks to your watchlist.</Typography>
    ) : (
      filteredWatchlist.map((stock) => (
        <StockItem key={stock.symbol} stock={stock} removeFromWatchlist={removeFromWatchlist} />
      ))
    )}
  </StockListContainer>
);

export default StockList;