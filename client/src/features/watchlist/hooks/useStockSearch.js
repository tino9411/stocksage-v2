import { useState, useCallback } from 'react';
import axiosInstance from '../../../axiosConfig';

export const useStockSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const performSearch = useCallback(async (query) => {
    if (query.length <= 1) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get(`/api/stocks/search?query=${query}`);
      setSearchResults(response.data);
    } catch (err) {
      console.error('Error searching stocks:', err);
      setError('Failed to search stocks. Please try again later.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    loading,
    error,
    performSearch,
    clearSearch
  };
};