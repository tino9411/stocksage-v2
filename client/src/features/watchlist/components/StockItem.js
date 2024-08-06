import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import { useTheme } from '@mui/system';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  StyledStockItem,
  StockIndicator,
  StockSymbol,
  StockPrice,
  StockChange
} from '../styles/StockItemStyles';


const StockItem = ({ stock, onRemove }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [highlight, setHighlight] = useState(false);
  const prevPrice = useRef(stock.price);
  const theme = useTheme();

  useEffect(() => {
    if (stock.price !== prevPrice.current) {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 1000);
      prevPrice.current = stock.price;
      return () => clearTimeout(timer);
    }
  }, [stock.price]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = () => {
    onRemove();
    handleMenuClose();
  };

  const getChangePercent = () => {
    if (stock.changePercent !== undefined) {
      return `${stock.change >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`;
    }
    if (stock.change !== undefined && stock.price) {
      return `${stock.change >= 0 ? '+' : ''}${((stock.change / stock.price) * 100).toFixed(2)}%`;
    }
    return 'N/A';
  };

  const isPositive = stock.change >= 0;

  return (
    <StyledStockItem>
      <StockIndicator $positive={isPositive} />
      <Box>
        <StockSymbol>{stock.symbol}</StockSymbol>
        <Typography variant="body2" color="textSecondary">{stock.companyName}</Typography>
      </Box>
      <Box sx={{ marginLeft: 'auto', textAlign: 'right', paddingRight: theme.spacing(4) }}>
        <StockPrice $highlight={highlight}>
          {stock.price ? `$${stock.price.toFixed(2)}` : 'N/A'}
        </StockPrice>
        <StockChange $positive={isPositive}>
          {getChangePercent()}
        </StockChange>
      </Box>
      <IconButton onClick={handleMenuOpen} size="small">
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
    </StyledStockItem>
  );
};

export default StockItem;