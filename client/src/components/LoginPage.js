import React from 'react';
import { Box, Typography } from '@mui/material';
import LoginButton from './LoginButton';

const LoginPage = () => {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
      <Typography variant="h4" gutterBottom>
        Welcome to the App
      </Typography>
      <LoginButton />
    </Box>
  );
};

export default LoginPage;
