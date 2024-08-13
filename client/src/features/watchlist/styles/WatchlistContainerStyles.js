import { styled } from '@mui/system';
import { Box } from '@mui/material';

export const StyledWatchlistContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  width: '300px',
  backgroundColor: '#373944',
  color: theme.palette.text.primary,
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
}));