import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

export function useIncome() {
  const queryClient = useQueryClient();

  // Retrieve chronological flat ledger of income natively
  const { data: incomeEntries, isLoading } = useQuery({
    queryKey: ['income'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/income');
      return data; // Assume returns arrays mapping source, amount, and monthly string dates natively
    },
  });

  const addIncomeMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/api/income', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['income']);
      queryClient.invalidateQueries(['cashFlow']); // Cash flow bounds immediately adapt income mutations organically natively.
    }
  });

  return {
    incomeEntries,
    isLoading,
    addIncome: addIncomeMutation.mutateAsync,
    isAdding: addIncomeMutation.isPending
  };
}
