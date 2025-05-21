import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import { DashboardStats } from '@/types/dashboard';

interface DashboardResponse {
  stats: DashboardStats;
  error?: string;
}

export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR<DashboardResponse>(
    '/api/dashboard/stats',
    fetchAPI,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      revalidateOnMount: true,
      // Provide fallback data to avoid loading state
      fallbackData: {
        stats: {
          totalProjects: 0,
          projectGrowth: 0,
          recentProjects: [],
          systemStats: null,
        },
      },
    }
  );

  return {
    stats: data?.stats,
    isLoading,
    isError: error,
    refetch: () => mutate(), // Keep refetch function for manual refreshes
  };
}
