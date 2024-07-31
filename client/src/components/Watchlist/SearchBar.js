import React from 'react';
import { Box, TextField, InputAdornment, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { styled } from '@mui/system';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';

const SearchBarContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const SearchBar = ({ searchTerm, handleSearchChange, searchResults, addToWatchlist }) => (
  <SearchBarContainer>
    <TextField
      fullWidth
      variant="outlined"
      placeholder="Search stocks..."
      value={searchTerm}
      onChange={handleSearchChange}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
    />
    {searchResults.length > 0 && (
      <List>
        {searchResults.map((result) => (
          <ListItem key={result.symbol}>
            <ListItemText primary={result.symbol} secondary={result.name} />
            <IconButton onClick={() => addToWatchlist(result.symbol)}>
              <AddIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
    )}
  </SearchBarContainer>
);

export default SearchBar;