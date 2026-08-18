import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

export function useDashboardData() {
  const fetchSummary = async () => {
    const { data } = await apiClient.get('/api/dashboard/summary');
    return data || null;
  };

  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: fetchSummary,
  });

  return {
    summaryData,
    isLoadingSummary,
  };
}
