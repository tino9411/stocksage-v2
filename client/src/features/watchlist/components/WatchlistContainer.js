import React from 'react';
import { Typography, CircularProgress } from '@mui/material';
import { StyledWatchlistContainer } from '../styles/WatchlistContainerStyles';
import SearchBar from './SearchBar';
import WatchlistFilter from './WatchlistFilter';
import StockList from './StockList';
import { useWatchlistContext } from '../contexts/WatchlistContext';
import { useUser } from '../../../contexts/UserContext';

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
  );
}

export default WatchlistContainer;