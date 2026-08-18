import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

export function useChat() {
  const queryClient = useQueryClient();

  // Polling historical threads
  const { data: sessions, isLoading: isSessionsLoading } = useQuery({
    queryKey: ['chatSessions'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/chat/sessions');
      return data || [];
    },
  });

  // Pull individual thread
  const fetchSession = async (sessionId) => {
    const { data } = await apiClient.get(`/api/chat/sessions/${sessionId}`);
    return data || null;
  };

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/api/chat/sessions', {});
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries(['chatSessions']); }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ sessionId, content }) => {
      const { data } = await apiClient.post(`/api/chat/ask`, { sessionId, message: content });
      return data;
    },
  });

  return {
    sessions,
    isSessionsLoading,
    fetchSession,
    createSession: createSessionMutation.mutateAsync,
    isCreating: createSessionMutation.isPending,
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
  };
}
