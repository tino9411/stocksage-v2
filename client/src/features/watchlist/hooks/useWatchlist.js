import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { watchlistApi } from '../api/watchlistApi';

export const useWatchlist = () => {
    const { user } = useUser();
    const [watchlist, setWatchlist] = useState([]);
    const [filteredWatchlist, setFilteredWatchlist] = useState([]);
    const [selectedStocks, setSelectedStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const wsRef = useRef(null);

  const fetchWatchlist = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const data = await watchlistApi.fetchWatchlist();
      console.log('Fetched watchlist:', data);
      setWatchlist(data);
      setFilteredWatchlist(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load watchlist. Please try again later.');
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  useEffect(() => {
    // WebSocket logic remains the same
    // ...
  }, [user, watchlist]);

  useEffect(() => {
    const filtered = watchlist.filter(stock => 
      (stock.symbol && stock.symbol.toLowerCase().includes(filterTerm.toLowerCase())) ||
      (stock.companyName && stock.companyName.toLowerCase().includes(filterTerm.toLowerCase()))
    );
    setFilteredWatchlist(filtered);
  }, [filterTerm, watchlist]);

  const handleSearchChange = async (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (value.length > 1) {
      try {
        const results = await watchlistApi.searchStocks(value);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching stocks:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleFilterChange = (event) => {
    const value = event.target.value;
    setSelectedStocks(value);
  };

  useEffect(() => {
    if (selectedStocks.length === 0) {
      setFilteredWatchlist(watchlist);
    } else {
      const filtered = watchlist.filter(stock => 
        selectedStocks.includes(stock.symbol)
      );
      setFilteredWatchlist(filtered);
    }
  }, [selectedStocks, watchlist]);

  const addToWatchlist = async (symbol) => {
    if (!user) return;
    try {
      await watchlistApi.addToWatchlist(symbol);
      await fetchWatchlist();
      setSearchTerm('');
      setSearchResults([]);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'subscribe', symbols: [symbol] }));
      }
    } catch (error) {
      console.error('Error adding stock to watchlist:', error);
    }
  };

  const removeFromWatchlist = async (symbol) => {
    if (!user) return;
    try {
      await watchlistApi.removeFromWatchlist(symbol);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'unsubscribe', symbols: [symbol] }));
      }
      setWatchlist(prevWatchlist => prevWatchlist.filter(stock => stock.symbol !== symbol));
    } catch (error) {
      console.error('Error removing stock from watchlist:', error);
    }
  };

  return {
    watchlist,
    filteredWatchlist,
    selectedStocks,
    loading,
    error,
    searchTerm,
    filterTerm,
    searchResults,
    handleSearchChange,
    handleFilterChange,
    addToWatchlist,
    removeFromWatchlist,
  };
};