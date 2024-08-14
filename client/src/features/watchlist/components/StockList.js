import React from 'react';
import { Typography } from '@mui/material';
import StockItem from './StockItem';
import { StyledStockList } from '../styles/watchlistStyles';

const StockList = ({ filteredWatchlist = [], removeFromWatchlist }) => {
  if (filteredWatchlist.length === 0) {
    return (
      <Typography>No stocks found. Try a different search term or add new stocks to your watchlist.</Typography>
    );
  }

  return (
    <StyledStockList>
      {filteredWatchlist.map((stock) => (
        <StockItem key={stock.symbol} stock={stock} onRemove={() => removeFromWatchlist(stock.symbol)} />
      ))}
    </StyledStockList>
  );
};

export default StockList;