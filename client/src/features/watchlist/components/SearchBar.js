import React from 'react';
import { 
  TextField, 
  InputAdornment, 
  ListItem, 
  ListItemText, 
  IconButton,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { SearchBarContainer, SearchResultsList, ErrorMessage } from '../styles/SearchBarStyles';

const SearchBar = ({ 
  searchTerm, 
  handleSearchChange, 
  searchResults, 
  addToWatchlist,
  loading,
  error
}) => (
  <SearchBarContainer>
    <TextField
      fullWidth
      variant="outlined"
      placeholder="Search stocks to add..."
      value={searchTerm}
      onChange={handleSearchChange}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            {loading && <CircularProgress size={20} />}
          </InputAdornment>
        ),
      }}
    />
    {error && <ErrorMessage>{error}</ErrorMessage>}
    {searchResults.length > 0 && !loading && !error && (
      <SearchResultsList>
        {searchResults.map((result) => (
          <ListItem key={result.symbol}>
            <ListItemText primary={result.symbol} secondary={result.name} />
            <IconButton onClick={() => addToWatchlist(result.symbol)} size="small">
              <AddIcon />
            </IconButton>
          </ListItem>
        ))}
      </SearchResultsList>
    )}
  </SearchBarContainer>
);

export default SearchBar;