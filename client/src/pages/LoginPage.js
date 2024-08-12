import React, { useState } from 'react';
import { Container, Paper, Tabs, Tab, Box } from '@mui/material';
import LoginForm from '../features/auth/components/LoginForm';
import RegisterForm from '../features/auth/components/RegisterForm';
import { useRedirectIfAuthenticated } from '../hooks/useRedirectIfAuthenticated';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { loading } = useRedirectIfAuthenticated('/dashboard');

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>
        <Box sx={{ mt: 2 }}>
          {activeTab === 0 ? <LoginForm /> : <RegisterForm />}
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;