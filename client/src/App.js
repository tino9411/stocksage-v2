import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { ChatProvider } from './features/chat';
import { UserProvider } from './contexts/UserContext';
import MainLayout from './components/MainLayout';
import AuthCallback from './components/AuthCallback';
import LoginPage from './components/LoginPage';
import { useUser } from './contexts/UserContext';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

// Route guard component
const PrivateRoute = ({ children }) => {
  const { user, loading } = useUser();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

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
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <MainLayout />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/" 
                element={
                  <PrivateRoute>
                    <MainLayout />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </Router>
        </ChatProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;