import React, { useState } from 'react';
import { Typography, CircularProgress, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SearchBar from './SearchBar';
import WatchlistFilter from './WatchlistFilter';
import StockList from './StockList';
import { useWatchlistContext } from '../contexts/WatchlistContext';
import { useUser } from '../../../contexts/UserContext';
import {
  StyledWatchlistContainer,
  WatchlistToggleButton,
  WatchlistWrapper,
} from '../styles/watchlistStyles';

function WatchlistContainer() {
  const { user } = useUser();
  const {
    watchlist,
    filteredWatchlist,
    selectedStocks,
    loading,
    error,
    searchTerm,
    searchResults,
    handleSearchChange,
    handleFilterChange,
    addToWatchlist,
    removeFromWatchlist
  } = useWatchlistContext();

  const [isWatchlistVisible, setIsWatchlistVisible] = useState(false);

  const toggleWatchlist = () => {
    setIsWatchlistVisible(!isWatchlistVisible);
  };

  if (!user) {
    return (
      <StyledWatchlistContainer>
        <Typography>Please log in to view your watchlist.</Typography>
      </StyledWatchlistContainer>
    );
  }

  if (loading) {
    return (
      <StyledWatchlistContainer>
        <CircularProgress />
      </StyledWatchlistContainer>
    );
  }

  if (error) {
    return (
      <StyledWatchlistContainer>
        <Typography color="error">{error}</Typography>
      </StyledWatchlistContainer>
    );
  }

  return (
    <>
      <WatchlistToggleButton>
        <IconButton onClick={toggleWatchlist} color="primary">
          {isWatchlistVisible ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
      </WatchlistToggleButton>
      <WatchlistWrapper isVisible={isWatchlistVisible}>
        <StyledWatchlistContainer>
          <SearchBar
            searchTerm={searchTerm}
            handleSearchChange={handleSearchChange}
            searchResults={searchResults}
            addToWatchlist={addToWatchlist}
            loading={loading}
            error={error}
          />
          <WatchlistFilter
            stocks={watchlist}
            selectedStocks={selectedStocks}
            handleFilterChange={handleFilterChange}
          />
          <StockList
            filteredWatchlist={filteredWatchlist}
            removeFromWatchlist={removeFromWatchlist}
          />
        </StyledWatchlistContainer>
      </WatchlistWrapper>
    </>
  );
}

export default WatchlistContainer;