import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { ChatProvider } from './contexts/ChatContext';
import { UserProvider } from './contexts/UserContext';
import MainLayout from './components/MainLayout';
import AuthCallback from './components/AuthCallback';
import LoginPage from './components/LoginPage';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <UserProvider>
        <ChatProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/dashboard" element={<MainLayout />} />
              <Route path="/" element={<MainLayout />} />
            </Routes>
          </Router>
        </ChatProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;