import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, ListItem, Menu, MenuItem } from '@mui/material';
import { styled, useTheme } from '@mui/system';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const StockItemContainer = styled(ListItem)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:last-child': {
    borderBottom: 'none',
  },
  padding: theme.spacing(1, 0),
  position: 'relative',
  paddingRight: theme.spacing(1),
}));

const StockIndicator = styled('div')(({ theme, $positive }) => ({
  width: '4px',
  height: '100%',
  backgroundColor: $positive ? theme.palette.success.main : theme.palette.error.main,
  marginRight: theme.spacing(2),
}));

const StockSymbol = styled(Typography)({
  fontWeight: 'bold',
});

const StockPrice = styled(Typography)(({ theme, $highlight }) => ({
  fontWeight: 'bold',
  marginLeft: 'auto',
  transition: 'background-color 0.3s ease',
  backgroundColor: $highlight ? theme.palette.action.selected : 'transparent',
  padding: theme.spacing(0.5),
  borderRadius: theme.shape.borderRadius,
}));

const StockChange = styled(Typography)(({ theme, $positive }) => ({
  color: $positive ? theme.palette.success.main : theme.palette.error.main,
  marginLeft: theme.spacing(1),
}));

const StockItem = ({ stock, removeFromWatchlist }) => {
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
    removeFromWatchlist(stock.symbol);
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
    <StockItemContainer>
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
      <IconButton onClick={handleMenuOpen}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
    </StockItemContainer>
  );
};

export default StockItem;