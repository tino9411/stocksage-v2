import { Box, Typography, CircularProgress } from '@mui/material';
import { styled } from '@mui/system';

const WatchlistContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  backgroundColor: '#373944',
  color: theme.palette.text.primary,
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
}));

export default WatchlistContainer;