import useSWR from 'swr';
import { fetchAPI, projectStatusApi } from '@/lib/api';
import { ProjectStatus } from '@/types/project';

// Hook to get statuses for a specific project
export function useProjectStatusesByProjectId(projectId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    projectId ? `/api/projects/${projectId}/statuses` : null,
    projectId ? () => projectStatusApi.getProjectStatusesByProjectId(projectId) : null
  );

  return {
    statuses: (data?.statuses as ProjectStatus[]) || [],
    isLoading,
    isError: error,
    mutate,
  };
}

// Legacy hook for backward compatibility
// This will fetch statuses from the first available project
export function useProjectStatuses() {
  const { data, error, isLoading, mutate } = useSWR(
    'global-project-statuses',
    projectStatusApi.getProjectStatuses
  );

  return {
    statuses: (data?.statuses as ProjectStatus[]) || [],
    isLoading,
    isError: error,
    mutate,
  };
}
