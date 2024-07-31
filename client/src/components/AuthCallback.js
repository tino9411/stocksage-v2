import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { fetchUser } = useUser();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        await fetchUser();
        navigate('/dashboard');
      } catch (error) {
        console.error('Error in auth callback:', error);
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [fetchUser, navigate]);

  return <div>Authenticating...</div>;
};

export default AuthCallback;