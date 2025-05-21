'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { teamManagementApi } from '@/lib/api';

/**
 * Hook to fetch team members with pagination and filtering
 */
export function useTeamMembers(projectId?: string, page = 1, limit = 10, search?: string) {
  const { data, error, mutate, isLoading } = useSWR(
    [`/api/team-management`, projectId, page, limit, search],
    () => teamManagementApi.getTeamMembers(projectId, page, limit, search),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    teamMembers: data?.teamMembers || [],
    pagination: data?.pagination || { totalCount: 0, page, pageSize: limit, pageCount: 0 },
    isLoading,
    isError: !!error,
    mutate,
  };
}

/**
 * Hook to fetch a specific team member
 */
export function useTeamMember(id: string) {
  const { data, error, mutate, isLoading } = useSWR(
    id ? `/api/team-management/${id}` : null,
    () => teamManagementApi.getTeamMember(id),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    teamMember: data?.teamMember || null,
    isLoading,
    isError: !!error,
    mutate,
  };
}

/**
 * Hook to fetch team memberships for a user
 */
export function useUserTeamMemberships(userId: string, page = 1, limit = 10) {
  const { data, error, mutate, isLoading } = useSWR(
    userId ? [`/api/team-management`, userId, page, limit] : null,
    () => teamManagementApi.getUserTeamMemberships(userId, page, limit),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    teamMemberships: data || [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

/**
 * Hook to add a team member
 */
export function useAddTeamMember() {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTeamMember = async (teamMember: { userId: string; projectId: string }) => {
    setIsAdding(true);
    setError(null);

    try {
      const result = await teamManagementApi.addTeamMember(teamMember);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to add team member');
      throw err;
    } finally {
      setIsAdding(false);
    }
  };

  return {
    addTeamMember,
    isAdding,
    error,
  };
}

/**
 * Hook to remove a team member
 */
export function useRemoveTeamMember() {
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeTeamMember = async (teamMemberId: string) => {
    setIsRemoving(true);
    setError(null);

    try {
      const result = await teamManagementApi.removeTeamMember(teamMemberId);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to remove team member');
      throw err;
    } finally {
      setIsRemoving(false);
    }
  };

  return {
    removeTeamMember,
    isRemoving,
    error,
  };
}

/**
 * Hook to check if a user is a member of a project
 */
export function useProjectMembership(projectId: string) {
  const { data, error, mutate, isLoading } = useSWR(
    projectId ? `/api/team-management/membership?projectId=${projectId}` : null,
    () => teamManagementApi.checkProjectMembership(projectId),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    isMember: data?.isMember || false,
    isLoading,
    isError: !!error,
    mutate,
  };
}
