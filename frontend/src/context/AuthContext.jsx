import { useEffect, createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  // Clear any legacy tokens stored in localStorage to enforce pure cookie auth
  useEffect(() => {
    localStorage.removeItem('finpilot_token');
    localStorage.removeItem('finpilot_refresh_token');
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
  }, []);

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/api/auth/me');
        return data || null;
      } catch {
        return null; // Resolve cleanly when not authenticated
      }
    },
    retry: false, // Do not spam retries for 401s
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const { data } = await apiClient.post('/api/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      if (data?.accessToken) {
        sessionStorage.setItem('finpilot_access_token', data.accessToken);
      }
      if (data?.refreshToken) {
        sessionStorage.setItem('finpilot_refresh_token', data.refreshToken);
      }
      if (data?.user) {
        queryClient.setQueryData(['me'], data.user);
      }
      queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (details) => {
      const { data } = await apiClient.post('/api/auth/register', details);
      return data;
    },
    onSuccess: (data) => {
      if (data?.accessToken) {
        sessionStorage.setItem('finpilot_access_token', data.accessToken);
      }
      if (data?.refreshToken) {
        sessionStorage.setItem('finpilot_refresh_token', data.refreshToken);
      }
      if (data?.user) {
        queryClient.setQueryData(['me'], data.user);
      }
      queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });

  const logout = async () => {
    try {
      const refreshToken = sessionStorage.getItem('finpilot_refresh_token');
      await apiClient.post('/api/auth/logout', { refreshToken });
    } catch {
      // Ignore network errors on logout
    } finally {
      sessionStorage.removeItem('finpilot_access_token');
      sessionStorage.removeItem('finpilot_refresh_token');
      queryClient.setQueryData(['me'], null);
      queryClient.clear();
      localStorage.removeItem('finpilot_token');
      localStorage.removeItem('finpilot_refresh_token');
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
    }
  };

  const value = {
    user,
    token: sessionStorage.getItem('finpilot_access_token') || null,
    isUserLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    isLoginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    isRegisterLoading: registerMutation.isPending,
    registerError: registerMutation.error,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
