import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

export const useRedirectIfAuthenticated = (redirectPath) => {
  const { user, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate(redirectPath);
    }
  }, [user, loading, navigate, redirectPath]);

  return { loading };
};
