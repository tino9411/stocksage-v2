import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Divider, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoginButton from './LoginButton';
import { useUser } from '../../../contexts/UserContext';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        email,
        password
      }, { withCredentials: true });
      setUser(response.data.user);
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.status === 409) {
        setNeedsPassword(true);
      } else {
        setError(error.response?.data?.message || 'An error occurred. Please try again.');
      }
    }
  };

  const handleSetPassword = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/add-password`, {
        email,
        password
      }, { withCredentials: true });
      // After setting the password, try to log in
      handleSubmit(new Event('submit'));
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred while setting the password.');
    }
  };

  if (needsPassword) {
    return (
      <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Set Password for Google Account</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Your account was created with Google Sign-In. Please set a password to enable email/password login.
        </Typography>
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="New Password"
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          onClick={handleSetPassword}
        >
          Set Password
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 400, mx: 'auto' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type="password"
        id="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
      >
        Sign In
      </Button>
      <Divider sx={{ my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>
      <LoginButton />
    </Box>
  );
};

export default LoginForm;