import { styled } from '@mui/system';
import { ListItem, Typography } from '@mui/material';

export const StyledStockItem = styled(ListItem)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:last-child': {
    borderBottom: 'none',
  },
  padding: theme.spacing(1, 0),
  position: 'relative',
  paddingRight: theme.spacing(1),
}));

export const StockIndicator = styled('div')(({ theme, $positive }) => ({
  width: '4px',
  height: '100%',
  backgroundColor: $positive ? theme.palette.success.main : theme.palette.error.main,
  marginRight: theme.spacing(2),
}));

export const StockSymbol = styled(Typography)({
  fontWeight: 'bold',
});

export const StockPrice = styled(Typography)(({ theme, $highlight }) => ({
  fontWeight: 'bold',
  marginLeft: 'auto',
  transition: 'background-color 0.3s ease',
  backgroundColor: $highlight ? theme.palette.action.selected : 'transparent',
  padding: theme.spacing(0.5),
  borderRadius: theme.shape.borderRadius,
}));

export const StockChange = styled(Typography)(({ theme, $positive }) => ({
  color: $positive ? theme.palette.success.main : theme.palette.error.main,
  marginLeft: theme.spacing(1),
}));