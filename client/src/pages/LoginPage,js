import React from 'react';
import { Box, Typography } from '@mui/material';
import LoginForm from '../components/forms/LoginForm';
import { useRedirectIfAuthenticated } from '../hooks/useRedirectIfAuthenticated';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const LoginPage = () => {
  const { loading } = useRedirectIfAuthenticated('/dashboard');

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
      <Typography variant="h4" gutterBottom>
        Welcome to the App
      </Typography>
      <LoginForm />
    </Box>
  );
};

export default LoginPage;
