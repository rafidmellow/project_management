import useSWR from 'swr';
import { userApi } from '@/lib/api';
import { UserSummary, UsersListResponse } from '@/types/user';

// Extend UserSummary with createdAt for display purposes
type UserWithCreatedAt = UserSummary & {
  createdAt?: string;
};

type UseUsersOptions = {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
  projectId?: string;
};

/**
 * Hook to fetch users from the API with server-side pagination and filtering
 */
export function useUsers(options: UseUsersOptions = {}) {
  const { search = '', limit = 10, page = 1, role, projectId } = options;

  // Build query string with all parameters
  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (limit) queryParams.set('take', limit.toString());
  if (page) queryParams.set('skip', ((page - 1) * limit).toString());
  if (role && role !== 'all') queryParams.set('role', role);
  if (projectId) queryParams.set('projectId', projectId);

  const queryString = queryParams.toString();

  const { data, error, isLoading, mutate } = useSWR(`/api/users?${queryString}`, async () => {
    const response = await userApi.getUsers({
      search,
      limit,
      page,
      role: role !== 'all' ? role : undefined,
      projectId,
    });
    return response as UsersListResponse;
  });

  return {
    users: data?.users || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch users for a specific project
 */
export function useProjectUsers(projectId: string, limit = 10) {
  const { data, error, isLoading, mutate } = useSWR(
    projectId ? `/api/users?projectId=${projectId}&limit=${limit}` : null,
    async () => {
      const response = await userApi.getUsersInProject(projectId, limit);
      return response as UsersListResponse;
    }
  );

  return {
    users: data?.users || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}
