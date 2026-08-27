import { useState, useEffect, createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(localStorage.getItem('finpilot_token'));

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/api/auth/me');
        return data || null;
      } catch (error) {
        if (error.response?.status === 401) {
          setToken(null);
          localStorage.removeItem('finpilot_token');
          localStorage.removeItem('finpilot_refresh_token');
        }
        return null; // Resolve cleanly
      }
    },
    enabled: !!token,
    retry: false, // Do not spam retries for 401s
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const { data } = await apiClient.post('/api/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      setToken(data.accessToken);
      localStorage.setItem('finpilot_token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('finpilot_refresh_token', data.refreshToken);
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
      setToken(data.accessToken);
      localStorage.setItem('finpilot_token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('finpilot_refresh_token', data.refreshToken);
      }
      queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  });

  const logout = () => {
    const storedRefreshToken = localStorage.getItem('finpilot_refresh_token');
    setToken(null);
    localStorage.removeItem('finpilot_token');
    localStorage.removeItem('finpilot_refresh_token');
    apiClient.post('/api/auth/logout', { refreshToken: storedRefreshToken }).catch(() => {});
    queryClient.clear();
  };

  const value = {
    user,
    token,
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
