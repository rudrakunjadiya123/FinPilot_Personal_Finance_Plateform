import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

/**
 * Hook for consuming statement dashboard data with advanced filters
 * @param {Object} filters - { startDate, endDate, statementType, bankName, categories }
 */
export function useStatements(filters = {}) {
  const queryClient = useQueryClient();

  // Convert filters object into a stable sorted string for Query Key tracking
  const filterParams = new URLSearchParams();
  if (filters.startDate) filterParams.append('startDate', filters.startDate);
  if (filters.endDate) filterParams.append('endDate', filters.endDate);
  if (filters.statementType) filterParams.append('statementType', filters.statementType);
  if (filters.bankName) filterParams.append('bankName', filters.bankName);
  if (filters.categories && filters.categories.length > 0) {
    filterParams.append('categories', filters.categories.join(','));
  }
  const filterString = filterParams.toString();
  const filterKey = ['statements', 'dashboard', filterString];

  // Dashboard metrics
  const { data: dashboard, isLoading: isDashboardLoading } = useQuery({
    queryKey: filterKey,
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/statements/dashboard?${filterString}`);
      return data;
    },
  });

  // Expense trend (12 months)
  const { data: expenseTrend } = useQuery({
    queryKey: ['statements', 'trend', 'expense', filterString],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/statements/trend/expense?${filterString}`);
      return data;
    },
  });

  // Savings trend (12 months)
  const { data: savingsTrend } = useQuery({
    queryKey: ['statements', 'trend', 'savings', filterString],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/statements/trend/savings?${filterString}`);
      return data;
    },
  });

  // Upload history
  const { data: uploads } = useQuery({
    queryKey: ['statements', 'uploads'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/statements/uploads');
      return data;
    },
  });

  // Dynamic banks mapping
  const { data: uniqueBanks } = useQuery({
    queryKey: ['statements', 'banks'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/statements/banks');
      return data;
    },
  });

  // Needs review queue
  const { data: needsReview, isLoading: isReviewLoading } = useQuery({
    queryKey: ['statements', 'needsReview'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/statements/needs-review');
      return data;
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, monthKey, statementType, bankName }) => {
      const formData = new FormData();
      formData.append('statement', file);
      formData.append('month', monthKey);
      if (statementType) formData.append('statementType', statementType);
      if (bankName) formData.append('bankName', bankName);

      const { data } = await apiClient.post('/api/statements/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: filterKey });
      queryClient.invalidateQueries({ queryKey: ['statements', 'uploads'] });
      queryClient.invalidateQueries({ queryKey: ['statements', 'needsReview'] });
      queryClient.invalidateQueries({ queryKey: ['statements', 'trend'] });
    },
  });

  // Correct category mutation
  const correctCategoryMutation = useMutation({
    mutationFn: async ({ transactionId, category }) => {
      const { data } = await apiClient.put(`/api/statements/transactions/${transactionId}/category`, { category });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: filterKey });
      queryClient.invalidateQueries({ queryKey: ['statements', 'needsReview'] });
      queryClient.invalidateQueries({ queryKey: ['statements', 'trend'] });
    },
  });

  // Dynamically auto-updating AI Insights hooked natively into filter mutations 
  const { data: insightsData, isLoading: isInsightsLoading } = useQuery({
    queryKey: ['statements', 'insights', filterString],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/statements/insights?${filterString}`);
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cash responses for 5 mins to prevent severe token drain if user toggles wildly
  });

  // Add Investment Mutation
  const addInvestmentMutation = useMutation({
    mutationFn: async ({ monthKey, amount, note }) => {
      const { data } = await apiClient.post(`/api/statements/${monthKey}/investment`, { amount, note });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: filterKey });
      queryClient.invalidateQueries({ queryKey: ['statements', 'trend'] });
    },
  });

  // Delete Upload Mutation
  const deleteUploadMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await apiClient.delete(`/api/statements/uploads/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: filterKey });
      queryClient.invalidateQueries({ queryKey: ['statements', 'uploads'] });
      queryClient.invalidateQueries({ queryKey: ['statements', 'needsReview'] });
      queryClient.invalidateQueries({ queryKey: ['statements', 'trend'] });
    },
  });

  return {
    dashboard,
    isDashboardLoading,
    uploads,
    uniqueBanks,
    needsReview,
    isReviewLoading,
    expenseTrend,
    savingsTrend,
    uploadStatement: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    deleteUpload: deleteUploadMutation.mutateAsync,
    isDeletingUpload: deleteUploadMutation.isPending,
    correctCategory: correctCategoryMutation.mutateAsync,
    addInvestment: addInvestmentMutation.mutateAsync,
    aiInsights: insightsData?.insights || null,
    isInsightsLoading,
  };
}
