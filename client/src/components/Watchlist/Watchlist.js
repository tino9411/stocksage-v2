import React, { useState, useEffect, useCallback, useRef } from 'react';
import WatchlistContainer from './WatchlistContainer';
import SearchBar from './SearchBar';
import StockList from './StockList';
import { Typography, CircularProgress } from '@mui/material';
import axiosInstance from '../../axiosConfig';
import { useUser } from '../../contexts/UserContext';

function WatchlistComponent() {
  const { user } = useUser();
  const [watchlist, setWatchlist] = useState([]);
  const [filteredWatchlist, setFilteredWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const wsRef = useRef(null);

  const fetchWatchlist = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.get('/api/user/watchlist');
      console.log('Fetched watchlist:', response.data);
      setWatchlist(response.data);
      setFilteredWatchlist(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching watchlist:', err.response?.data || err.message);
      setError('Failed to load watchlist. Please try again later.');
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  useEffect(() => {
    if (user) {
      wsRef.current = new WebSocket('ws://localhost:3000/api/stocks/realtime');

      wsRef.current.onopen = () => {
        console.log('WebSocket connection established');
        if (watchlist.length > 0) {
          const symbols = watchlist.map(stock => stock.symbol);
          wsRef.current.send(JSON.stringify({ action: 'subscribe', symbols }));
        }
      };

      wsRef.current.onmessage = (event) => {
        const { symbol, data } = JSON.parse(event.data);
        setWatchlist(prevWatchlist => 
          prevWatchlist.map(stock => 
            stock.symbol === symbol
              ? { 
                  ...stock, 
                  price: parseFloat(data.lp) || stock.price,
                  change: parseFloat(data.lp) - stock.price,
                  changePercent: ((parseFloat(data.lp) - stock.price) / stock.price) * 100
                }
              : stock
          )
        );
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed');
      };

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    }
  }, [user, watchlist]);

  useEffect(() => {
    const filtered = watchlist.filter(stock => 
      (stock.symbol && stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (stock.companyName && stock.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredWatchlist(filtered);
  }, [searchTerm, watchlist]);

  const handleSearchChange = async (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (value.length > 1) {
      try {
        const response = await axiosInstance.get(`/api/stocks/search?query=${value}`);
        setSearchResults(response.data);
      } catch (error) {
        console.error('Error searching stocks:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const addToWatchlist = async (symbol) => {
    if (!user) return;
    try {
      await axiosInstance.post('/api/user/watchlist', { symbol });
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
      await axiosInstance.delete(`/api/user/watchlist/${symbol}`);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'unsubscribe', symbols: [symbol] }));
      }
      setWatchlist(prevWatchlist => prevWatchlist.filter(stock => stock.symbol !== symbol));
    } catch (error) {
      console.error('Error removing stock from watchlist:', error);
    }
  };

  if (!user) {
    return (
      <WatchlistContainer>
        <Typography>Please log in to view your watchlist.</Typography>
      </WatchlistContainer>
    );
  }

  if (loading) {
    return (
      <WatchlistContainer>
        <CircularProgress />
      </WatchlistContainer>
    );
  }

  if (error) {
    return (
      <WatchlistContainer>
        <Typography color="error">{error}</Typography>
      </WatchlistContainer>
    );
  }

  return (
    <WatchlistContainer>
      <SearchBar
        searchTerm={searchTerm}
        handleSearchChange={handleSearchChange}
        searchResults={searchResults}
        addToWatchlist={addToWatchlist}
      />
      <StockList
        filteredWatchlist={filteredWatchlist}
        removeFromWatchlist={removeFromWatchlist}
      />
    </WatchlistContainer>
  );
}

export default WatchlistComponent;