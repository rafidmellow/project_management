import useSWR from 'swr';
import { fetchAPI } from '@/lib/api';
import { TaskSummary } from '@/types/dashboard';

interface UserTasksResponse {
  tasks: TaskSummary[];
  error?: string;
}

export function useUserTasks() {
  const { data, error, isLoading, mutate } = useSWR<UserTasksResponse>(
    '/api/dashboard/user-tasks',
    fetchAPI,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      revalidateOnMount: true,
      // Provide fallback data to avoid loading state
      fallbackData: {
        tasks: [],
      },
    }
  );

  // Get upcoming tasks (not completed, sorted by due date)
  const upcomingTasks = data?.tasks
    ? data.tasks
        .filter(task => !task.completed && task.dueDate)
        .sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        })
        .slice(0, 5)
    : [];

  return {
    tasks: data?.tasks || [],
    upcomingTasks,
    isLoading,
    isError: error,
    refetch: () => mutate(),
  };
}
