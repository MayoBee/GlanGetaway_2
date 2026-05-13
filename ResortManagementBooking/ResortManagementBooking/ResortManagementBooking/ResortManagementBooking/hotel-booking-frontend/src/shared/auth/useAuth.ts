import { useQuery } from 'react-query';
import { fetchCurrentUser, validateToken } from './api-client';

const useAuth = () => {
  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('session_id') : false;

  const { data: tokenValidation, isLoading: isTokenLoading } = useQuery(
    'validateToken',
    validateToken,
    {
      enabled: hasToken,
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );

  const { data: user, isLoading: isUserLoading } = useQuery(
    'currentUser',
    fetchCurrentUser,
    {
      enabled: hasToken,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );

  const isLoggedIn = hasToken;
  const isLoading = isTokenLoading || isUserLoading;
  const isAuthLoading = hasToken && !user && isLoading;

  return {
    user,
    isLoggedIn,
    isLoading,
    isAuthLoading,
    userRole: user?.role || null,
  };
};

export default useAuth;