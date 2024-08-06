import { styled } from '@mui/system';
import { Box, Typography, List } from '@mui/material';

export const SearchBarContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export const SearchResultsList = styled(List)(({ theme }) => ({
  maxHeight: '200px',
  overflowY: 'auto',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
}));

export const ErrorMessage = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
  marginTop: theme.spacing(1),
}));