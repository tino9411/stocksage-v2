import { styled } from '@mui/system';
import { Box, Typography, List, ListItem, FormControl, InputLabel, Select, MenuItem, Chip } from '@mui/material';

// SearchBar styles
export const SearchBarContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export const SearchResultsList = styled(List)(({ theme }) => ({
  maxHeight: '200px',
  overflowY: 'auto',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
}));

export const ErrorMessage = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
  marginTop: theme.spacing(1),
}));

// StockItem styles
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

// StockList styles
export const StyledStockList = styled(List)(({ theme }) => ({
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

// WatchlistContainer styles
export const StyledWatchlistContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  width: '100%',
  backgroundColor: '#373944',
  color: theme.palette.text.primary,
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  position: 'relative', // Added for positioning the toggle button
}));

// WatchlistFilter styles
export const StyledFormControl = styled(FormControl)(({ theme }) => ({
  margin: theme.spacing(1),
  minWidth: 200,
  maxWidth: '100%',
}));

export const StyledChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

// New styles for enhanced mobile responsiveness
export const WatchlistToggleButton = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: theme.spacing(2),
  left: theme.spacing(2),
  zIndex: 1000,
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

export const WatchlistWrapper = styled(Box)(({ theme, isVisible }) => ({
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#373944', // Match the main background color
    transform: isVisible ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.3s ease-in-out',
    zIndex: 999,
    [theme.breakpoints.up('md')]: {
      position: 'static',
      transform: 'none',
      backgroundColor: 'transparent',
    },
  }));
