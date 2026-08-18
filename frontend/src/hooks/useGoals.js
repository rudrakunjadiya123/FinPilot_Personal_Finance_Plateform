import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

export function useGoals() {
  const queryClient = useQueryClient();

  const { data: goalsObj, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/goals');
      return data; // Returns { goals: [...], globalPaceState: "" }
    },
  });

  const addGoalMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/api/goals', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      queryClient.invalidateQueries(['goalsSummary']); // Dashboard hook
    }
  });

  const logProgressMutation = useMutation({
    mutationFn: async ({ id, amount, note }) => {
      const { data } = await apiClient.post(`/api/goals/${id}/log-progress`, { amount, note });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      queryClient.invalidateQueries(['goalsSummary']);
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await apiClient.delete(`/api/goals/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      queryClient.invalidateQueries(['goalsSummary']);
    }
  });

  return {
    goals: goalsObj?.goals || [],
    globalPaceState: goalsObj?.globalPaceState,
    isLoading,
    addGoal: addGoalMutation.mutateAsync,
    isAdding: addGoalMutation.isPending,
    logProgress: logProgressMutation.mutateAsync,
    isLogging: logProgressMutation.isPending,
    deleteGoal: deleteGoalMutation.mutateAsync,
    isDeleting: deleteGoalMutation.isPending
  };
}
