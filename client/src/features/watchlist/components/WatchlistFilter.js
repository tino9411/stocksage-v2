import React from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip, 
  Box 
} from '@mui/material';
import { styled } from '@mui/system';

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  margin: theme.spacing(1),
  minWidth: 200,
  maxWidth: '100%',
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

const WatchlistFilter = ({ stocks, selectedStocks, handleFilterChange }) => {
  return (
    <StyledFormControl>
      <InputLabel id="watchlist-filter-label">Filter Stocks</InputLabel>
      <Select
        labelId="watchlist-filter-label"
        id="watchlist-filter"
        multiple
        value={selectedStocks}
        onChange={handleFilterChange}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {selected.map((value) => (
              <StyledChip key={value} label={value} />
            ))}
          </Box>
        )}
      >
        {stocks.map((stock) => (
          <MenuItem key={stock.symbol} value={stock.symbol}>
            {stock.symbol} - {stock.companyName}
          </MenuItem>
        ))}
      </Select>
    </StyledFormControl>
  );
};

export default WatchlistFilter;