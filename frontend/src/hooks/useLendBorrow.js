import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

export function useLendBorrow() {
  const queryClient = useQueryClient();

  const { data: records, isLoading } = useQuery({
    queryKey: ['lendBorrow'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/lendborrow');
      return data || [];
    },
  });

  const addRecordMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/api/lendborrow', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lendBorrow']);
      queryClient.invalidateQueries(['upcomingDues']);
    }
  });

  const repayMutation = useMutation({
    mutationFn: async (payload) => {
      const { id, ...rest } = payload;
      // POST mapping logic natively aligned with Master Spec route
      const { data } = await apiClient.post(`/api/lendborrow/${id}/repayment`, rest);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['lendBorrow']);
      queryClient.invalidateQueries(['upcomingDues']);
      queryClient.invalidateQueries(['cashFlow']);
      if (variables?.id) queryClient.invalidateQueries(['lendBorrow', variables.id]);
    }
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/api/lendborrow/remind', payload);
      return data;
    },
    onSuccess: () => {
    }
  });

  const changeInterestMutation = useMutation({
    mutationFn: async (payload) => {
      const { id, newRate, startDate, interestType, compoundingFrequency } = payload;
      const { data } = await apiClient.post(`/api/lendborrow/${id}/interest-rate`, { 
        newRate, 
        startDate,
        interestType,
        compoundingFrequency
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['lendBorrow']);
      queryClient.invalidateQueries(['upcomingDues']);
      if (variables?.id) queryClient.invalidateQueries(['lendBorrow', variables.id]);
    }
  });

  return {
    records,
    isLoading,
    addRecord: addRecordMutation.mutateAsync,
    isAdding: addRecordMutation.isPending,
    repayRecord: repayMutation.mutateAsync,
    isRepaying: repayMutation.isPending,
    sendReminder: sendReminderMutation.mutateAsync,
    isSendingReminder: sendReminderMutation.isPending,
    changeInterestRate: changeInterestMutation.mutateAsync,
    isChangingInterest: changeInterestMutation.isPending
  };
}

export function useLendBorrowRecord(id) {
  return useQuery({
    queryKey: ['lendBorrow', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await apiClient.get(`/api/lendborrow/${id}`);
      return data;
    },
    enabled: !!id,
  });
}
