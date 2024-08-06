import axiosInstance from '../../../axiosConfig';

export const watchlistApi = {
  fetchWatchlist: async () => {
    try {
      const response = await axiosInstance.get('/api/user/watchlist');
      return response.data;
    } catch (error) {
      console.error('Error fetching watchlist:', error.response?.data || error.message);
      throw error;
    }
  },

  searchStocks: async (query) => {
    try {
      const response = await axiosInstance.get(`/api/stocks/search?query=${query}`);
      return response.data;
    } catch (error) {
      console.error('Error searching stocks:', error);
      throw error;
    }
  },

  addToWatchlist: async (symbol) => {
    try {
      const response = await axiosInstance.post('/api/user/watchlist', { symbol });
      return response.data;
    } catch (error) {
      console.error('Error adding stock to watchlist:', error);
      throw error;
    }
  },

  removeFromWatchlist: async (symbol) => {
    try {
      const response = await axiosInstance.delete(`/api/user/watchlist/${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Error removing stock from watchlist:', error);
      throw error;
    }
  }
};