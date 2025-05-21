'use client';

import useSWR from 'swr';
import { projectApi, taskApi, eventApi } from '@/lib/api';

/**
 * Hook to fetch projects
 */
export function useProjects(page = 1, limit = 10, filters: Record<string, string> = {}) {
  // Enhanced filter cleaning to ensure proper handling of team member IDs and dates
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([key, value]) => {
      // Skip null, undefined, empty strings, and [object Object]
      if (value === null || value === undefined || value === '' || value === '[object Object]') {
        return false;
      }

      // Special handling for teamMemberIds to ensure it's properly formatted
      if (key === 'teamMemberIds' && typeof value === 'string') {
        // Make sure it's not an empty list
        return value.trim() !== '' && value !== ',';
      }

      // Special handling for date filters
      if ((key === 'startDate' || key === 'endDate') && typeof value === 'string') {
        try {
          // Validate that it's a proper date
          new Date(value);
          return true;
        } catch (e) {
          console.error(`Invalid date format for ${key}:`, value);
          return false;
        }
      }

      return true;
    })
  );

  // Create a query string with the cleaned filters
  const queryString = `/api/projects?page=${page}&limit=${limit}${
    Object.keys(cleanFilters).length > 0 ? `&${new URLSearchParams(cleanFilters).toString()}` : ''
  }`;

  const { data, error, isLoading, mutate } = useSWR(
    queryString,
    async () => {
      try {
        console.log('Fetching projects with params:', { page, limit, filters: cleanFilters });
        const response = await projectApi.getProjects(page, limit, cleanFilters);
        console.log('Projects fetch response:', response);
        return response;
      } catch (err) {
        console.error('Project fetch error:', err);
        // Create a more descriptive error
        const errorMessage =
          err instanceof Error
            ? `Failed to fetch projects: ${err.message}`
            : 'Failed to fetch projects';
        throw new Error(errorMessage);
      }
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      dedupingInterval: 5000,
      onError: err => {
        console.error('SWR error in useProjects:', err);
      },
    }
  );

  // Ensure we return the projects array in a consistent format
  let projectsData = [];

  if (data) {
    if (Array.isArray(data)) {
      projectsData = data;
    } else if (data.projects && Array.isArray(data.projects)) {
      projectsData = data.projects;
    }
  }

  return {
    projects: projectsData,
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch a single project
 */
export function useProject(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/projects/${id}` : null,
    async () => {
      if (!id) return null;
      console.log('Fetching project with ID:', id);
      try {
        const response = await projectApi.getProject(id);
        console.log('Project fetch response:', response);

        // Ensure we have a project object with a title
        if (response && response.project && response.project.title) {
          console.log('Project title for breadcrumbs:', response.project.title);
        } else {
          console.warn('Project data missing or incomplete:', response);
        }

        return response;
      } catch (err) {
        console.error('Error in useProject hook:', err);
        throw err;
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // Cache for 5 seconds
    }
  );

  return {
    project: data?.project,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch tasks
 */
export function useTasks(page = 1, limit = 10, filters = {}) {
  // Clean filters to avoid [object Object] and other invalid values
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(
      ([_, value]) =>
        value !== null &&
        value !== undefined &&
        value !== '[object Object]' &&
        String(value).trim() !== ''
    )
  );

  const queryString = `/api/tasks?page=${page}&limit=${limit}${
    Object.keys(cleanFilters).length > 0
      ? `&${new URLSearchParams(cleanFilters as Record<string, string>).toString()}`
      : ''
  }`;

  const { data, error, isLoading, mutate } = useSWR(queryString, async () => {
    console.log('Fetching tasks with query:', queryString);
    const response = await taskApi.getTasks(page, limit, cleanFilters);
    return response;
  });

  return {
    tasks: data?.tasks || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch a single task
 */
export function useTask(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    // Skip fetching if id is null or "new"
    id && id !== 'new' ? `/api/tasks/${id}` : null,
    async () => {
      if (!id || id === 'new') return null;
      try {
        console.log('Fetching task with ID:', id);
        const response = await taskApi.getTask(id);
        console.log('Task fetch success for ID:', id);
        return response;
      } catch (err) {
        console.error('Error in useTask hook:', err);
        // Don't throw here - let SWR handle the error
        return null;
      }
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      dedupingInterval: 5000, // Cache results for 5 seconds
    }
  );

  return {
    task: data?.task || null,
    isLoading: isLoading && id !== 'new', // Don't show loading state for "new"
    isError: error && id !== 'new', // Don't show error state for "new"
    mutate,
  };
}

// Team member hooks moved to hooks/use-team.ts

/**
 * Hook to fetch events
 */
export function useEvents(projectId?: string, page = 1, limit = 10) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/events?${projectId ? `projectId=${projectId}&` : ''}page=${page}&limit=${limit}`,
    async () => {
      const response = await eventApi.getEvents(projectId, page, limit);
      return response;
    }
  );

  return {
    events: data?.events || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}
