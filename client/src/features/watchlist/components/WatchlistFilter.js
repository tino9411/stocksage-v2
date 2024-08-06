import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { SearchBarContainer } from '../styles/SearchBarStyles';

const WatchlistFilter = ({ filterTerm, handleFilterChange }) => (
  <SearchBarContainer>
    <TextField
      fullWidth
      variant="outlined"
      placeholder="Filter watchlist..."
      value={filterTerm}
      onChange={handleFilterChange}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
    />
  </SearchBarContainer>
);

export default WatchlistFilter;