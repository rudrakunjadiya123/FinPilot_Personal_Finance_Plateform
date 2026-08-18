import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

export function useLoans() {
  const queryClient = useQueryClient();

  // GET All
  const { data: loans, isLoading: isLoansLoading } = useQuery({
    queryKey: ['loans'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/loans');
      return data;
    },
  });

  // POST Add
  const addLoanMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/api/loans', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['loans']);
    }
  });

  return { loans, isLoansLoading, addLoan: addLoanMutation.mutateAsync, isAddingLoan: addLoanMutation.isPending };
}

export function useLoanDetails(loanId) {
  const queryClient = useQueryClient();

  // GET Detail
  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['loans', loanId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/loans/${loanId}`);
      return data;
    },
    enabled: !!loanId, // Only fetch if ID exists
  });

  // GET EMIs
  const { data: scheduleData, isLoading: isScheduleLoading } = useQuery({
    queryKey: ['loans', loanId, 'emis'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/loans/${loanId}/schedule`);
      return data;
    },
    enabled: !!loanId,
  });

  // POST Simulate Prepayment
  const simulateMutation = useMutation({
    mutationFn: async (amount) => {
      const { data } = await apiClient.post(`/api/loans/${loanId}/simulate-prepayment`, { prepaymentAmount: amount });
      return data;
    }
  });

  // POST Commit Prepayment
  const commitMutation = useMutation({
    mutationFn: async (amount) => {
      // Re-running simulator route, but ideally checking out via real prepayment if route existed. 
      // Based on Master Spec, the simulate branch can be persisted optionally, but module 2 defined generic EMI payment structure.
      // Wait, Module 2 spec actually has POST /api/loans/:id/prepayments ? No, it has `POST /api/loans/:id/prepayment/simulate` 
      // And standard EMIs hit `PUT /api/loans/:id/emis/:emiId`. 
      // For now, let's just make the simulator mutation simulate, and mapping a confirm via updating emisechedule or a bulk prepay endpoint if existed.
      // Actually backend implementation has `POST /api/loans/:id/confirm-prepayment`.
      const { data } = await apiClient.post(`/api/loans/${loanId}/confirm-prepayment`, { prepaymentAmount: amount });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['loans']);
      queryClient.invalidateQueries(['loans', loanId]);
      queryClient.invalidateQueries(['loans', loanId, 'emis']);
      // Force FCF and Dues refreshes application wide organically.
      queryClient.invalidateQueries(['upcomingDues']);
    }
  });

  return { 
    loan: detailData, 
    progress: null, 
    schedule: scheduleData, 
    isDetailLoading, 
    isScheduleLoading,
    simulatePrepayment: simulateMutation.mutateAsync,
    isSimulating: simulateMutation.isPending,
    commitPrepayment: commitMutation.mutateAsync,
    isCommitting: commitMutation.isPending
  };
}

export function useLoanSuggestions() {
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['loanSuggestions'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/loans/suggestions');
      return data || [];
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (suggestionId) => {
      const { data } = await apiClient.post(`/api/loans/suggestions/${suggestionId}/accept`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['loanSuggestions']);
      queryClient.invalidateQueries(['loans']);
      queryClient.invalidateQueries(['dashboard']);
      queryClient.invalidateQueries(['upcomingDues']);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (suggestionId) => {
      const { data } = await apiClient.post(`/api/loans/suggestions/${suggestionId}/reject`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['loanSuggestions']);
    },
  });

  return {
    suggestions,
    isLoading,
    acceptSuggestion: acceptMutation.mutateAsync,
    isAccepting: acceptMutation.isPending,
    rejectSuggestion: rejectMutation.mutateAsync,
    isRejecting: rejectMutation.isPending,
  };
}
