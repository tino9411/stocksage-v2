import React from 'react';
import { useAuthCallback } from '../hooks/useAuthCallback';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const AuthCallback = () => {
  useAuthCallback();
  return <LoadingSpinner />;
};

export default AuthCallback;
