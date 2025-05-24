import { devLog } from '@/lib/utils/logger';
/**
 * API client utility for making requests to our backend API
 */

/**
 * Fetches data from the API with proper error handling
 */
export async function fetchAPI(url: string, options: RequestInit = {}) {
  // Set default headers for JSON requests if not provided
  options.headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, options);

    // Read the response text only once and store it
    const textResponse = await response.text();

    // Parse the data only if the response is successful
    let data;

    // Handle empty responses
    if (!textResponse || textResponse.trim() === '') {
      console.warn('Empty response received from API');
      data = {};
    } else if (
      textResponse.trim().startsWith('<!DOCTYPE') ||
      textResponse.trim().startsWith('<html')
    ) {
      // Handle HTML responses (likely an error page)
      console.error('Received HTML response instead of JSON:', textResponse.substring(0, 200));

      // For profile endpoints, return a default empty structure
      if (url.includes('/api/users/') && url.includes('profile=true')) {
        return {
          user: { id: 'unknown', name: 'Unknown User', email: 'unknown@example.com' },
          projects: [],
          tasks: [],
          activities: [],
          stats: { projectCount: 0, taskCount: 0, teamCount: 0, completionRate: '0%' },
        };
      } else if (url.includes('/api/team/user/')) {
        // For team memberships, return an empty array
        return [];
      }

      throw new Error(
        `Received HTML response instead of JSON. The API endpoint may not exist or returned an error page.`
      );
    } else {
      try {
        // Try to parse as JSON
        data = JSON.parse(textResponse);
      } catch (parseError) {
        console.error('API Error (parse failure):', parseError);

        // For specific endpoints, return default values instead of throwing
        if (url.includes('/api/team/user/')) {
          console.warn('Returning empty array for team memberships due to parse error');
          return [];
        }

        throw new Error(
          `Failed to parse API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        );
      }
    }

    // Check if data is empty or null
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      console.warn('API Warning: Empty response data');
    }

    if (!response.ok) {
      // We already have the response text, no need to read it again
      // Use the data we already parsed if available
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        message: data?.error || `Request failed with status ${response.status}`,
        details: data?.details || {},
        rawBody: textResponse.substring(0, 500), // Include start of raw body for context
      };

      console.error('API Error:', errorDetails);

      // Include more context in the error
      const enhancedError = {
        ...errorDetails,
        url,
        requestMethod: options.method || 'GET',
        timestamp: new Date().toISOString(),
      };

      // Use a more descriptive error message that includes the status code and message
      throw new Error(
        `API request failed: ${errorDetails.status} ${errorDetails.statusText} - ${errorDetails.message}`
      );
    }

    return data;
  } catch (error) {
    // Create a more descriptive error message
    let errorMessage = 'API request failed';

    if (error instanceof Error) {
      console.error('API request failed:', {
        url,
        message: error.message,
        stack: error.stack,
      });

      // Use the original error message
      errorMessage = `${errorMessage}: ${error.message}`;
    } else {
      // Handle non-Error objects
      console.error('API request failed with non-Error:', {
        url,
        error: String(error),
      });

      errorMessage = `${errorMessage}: ${String(error)}`;
    }

    // Create a new error with a more descriptive message
    const apiError = new Error(errorMessage);

    // Add the original error as a cause if supported
    if (error instanceof Error) {
      apiError.cause = error;
    }

    throw apiError;
  }
}

/**
 * User API functions
 */
export const userApi = {
  getUsers: async (options: any = {}) => {
    const { search, limit = 10, page = 1, role, projectId } = options;
    const params = new URLSearchParams();

    if (search) params.append('search', search);
    if (limit) params.append('take', limit.toString());
    if (page) params.append('skip', ((page - 1) * limit).toString());
    if (role) params.append('role', role);
    if (projectId) params.append('projectId', projectId);

    return fetchAPI(`/api/users?${params.toString()}`);
  },

  getUsersInProject: async (projectId: string, limit = 10) => {
    return userApi.getUsers({ projectId, limit });
  },

  getUserProfile: async (userId: string) => {
    try {
      return fetchAPI(`/api/users/${userId}?profile=true`);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  updateUserProfile: async (userId: string, profileData: any) => {
    devLog('Updating user profile:', userId, profileData);
    try {
      const result = await fetchAPI(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(profileData),
      });
      devLog('Update profile result:', result);
      return result;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  },

  uploadProfileImage: async (userId: string, file: File) => {
    devLog('Uploading profile image for user:', userId, 'File:', file.name, file.type, file.size);
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Use the correct endpoint format that matches our API structure
      const response = await fetch(`/api/users/${userId}/image`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile image upload failed:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      devLog('Profile image upload result:', result);
      return result;
    } catch (error) {
      console.error('Error in uploadProfileImage:', error);
      throw error;
    }
  },

  deleteUser: async (userId: string) => {
    return fetchAPI(`/api/users/${userId}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Project Status API functions
 */
export const projectStatusApi = {
  // Get all statuses (global)
  getProjectStatuses: async () => {
    // This function now fetches from all projects
    // We'll fetch from multiple projects and combine the results
    const response = await fetchAPI('/api/projects');
    const projects = response.projects || [];

    // If no projects, return empty array
    if (!projects.length) {
      return { statuses: [] };
    }

    // Get statuses from the first project (as a fallback)
    // In a real implementation, we might want to fetch from all projects
    // and combine the results, but for simplicity we'll use the first one
    const firstProject = projects[0];
    if (!firstProject || !firstProject.id) {
      console.error('No valid projects found to fetch statuses from');
      return { statuses: [] };
    }
    const projectId = firstProject.id as string;
    return fetchAPI(`/api/projects/${projectId}/statuses`);
  },

  // Get statuses for a specific project
  getProjectStatusesByProjectId: async (projectId: string) => {
    if (!projectId) {
      console.error('Project ID is required to fetch statuses');
      return { statuses: [] };
    }
    return fetchAPI(`/api/projects/${projectId}/statuses`);
  },

  // Create a status for a specific project
  createStatus: async (status: any) => {
    if (!status.projectId) {
      console.error('Project ID is required to create a status');
      throw new Error('Project ID is required');
    }

    return fetchAPI(`/api/projects/${status.projectId}/statuses`, {
      method: 'POST',
      body: JSON.stringify(status),
    });
  },
};

/**
 * Project API functions
 */
export const projectApi = {
  getProjects: async (page = 1, limit = 10, filters?: Record<string, string>) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    // Add filters if valid
    if (filters && typeof filters === 'object') {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'string' && value !== '[object Object]') {
          params.append(key, value);
        }
      });
    }

    devLog('Fetching projects with URL:', `/api/projects?${params.toString()}`);
    try {
      const result = await fetchAPI(`/api/projects?${params.toString()}`);
      devLog('Projects API response:', result);
      return result;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  getProject: async (id: string) => {
    devLog('API client: Getting project with ID:', id);
    try {
      const result = await fetchAPI(`/api/projects/${id}`);
      devLog('API client: Get project response:', result);
      return result;
    } catch (error) {
      console.error('API client: Error getting project:', error);
      throw error;
    }
  },

  createProject: async (project: any) => {
    return fetchAPI('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  },

  updateProject: async (id: string, project: any) => {
    devLog('API client: Updating project with ID:', id, 'Data:', project);
    try {
      const result = await fetchAPI(`/api/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(project),
      });
      devLog('API client: Update project response:', result);
      return result;
    } catch (error) {
      console.error('API client: Error updating project:', error);
      throw error;
    }
  },

  deleteProject: async (id: string) => {
    return fetchAPI(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Task API functions
 */
export const taskApi = {
  getTasks: async (page = 1, limit = 20, filters: Record<string, any> = {}) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    // Add any additional filters with better validation
    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== null &&
        value !== undefined &&
        value !== '[object Object]' &&
        String(value).trim() !== ''
      ) {
        params.append(key, value.toString());
      }
    });

    devLog('API getTasks params:', params.toString());
    return fetchAPI(`/api/tasks?${params.toString()}`);
  },

  getTask: async (id: string) => {
    // Skip API call for "new" route
    if (!id || id === 'new') {
      console.warn('API client: getTask called with invalid ID:', id);
      return { task: null };
    }

    devLog('API client: Getting task with ID:', id);
    try {
      const result = await fetchAPI(`/api/tasks/${id}`);
      if (!result || !result.task) {
        console.warn('API client: Task not found or empty response for ID:', id);
        return { task: null };
      }

      devLog('API client: Get task success for ID:', id);
      return result;
    } catch (error) {
      console.error('API client: Error getting task:', error);
      // Instead of rethrowing, return a structured error response
      return {
        task: null,
        error: error instanceof Error ? error.message : 'Unknown error fetching task',
      };
    }
  },

  createTask: async (task: any) => {
    devLog('API client: Creating task, data:', JSON.stringify(task));
    try {
      // Ensure we have required fields
      if (!task.title) {
        throw new Error('Task title is required');
      }
      if (!task.projectId) {
        throw new Error('Project ID is required');
      }

      // Remove status if present (it should be statusId instead)
      const { status, ...taskWithoutStatus } = task;

      const result = await fetchAPI('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskWithoutStatus),
      });

      devLog('API client: Create task response:', result);
      return result;
    } catch (error) {
      console.error('API client: Error creating task:', error);
      throw error;
    }
  },

  updateTask: async (id: string, task: any) => {
    devLog('API client: Updating task with ID:', id, 'Data:', task);
    try {
      // Remove status if present
      const { status, ...taskWithoutStatus } = task;
      const result = await fetchAPI(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(taskWithoutStatus),
      });
      devLog('API client: Update task response:', result);
      return result;
    } catch (error) {
      console.error('API client: Error updating task:', error);
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    devLog('API client: Deleting task with ID:', id);
    try {
      const result = await fetchAPI(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      devLog('API client: Delete task response:', result);
      return result;
    } catch (error) {
      console.error('API client: Error deleting task:', error);
      throw error;
    }
  },

  async reorderTasks(columnId: string, tasks: import('@/types/task').Task[]): Promise<void> {
    const response = await fetch(`/api/columns/${columnId}/tasks/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tasks }),
    });

    if (!response.ok) {
      throw new Error('Failed to reorder tasks');
    }
  },

  async moveTask(taskId: string, sourceColumnId: string, targetColumnId: string): Promise<void> {
    const response = await fetch(`/api/tasks/${taskId}/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceColumnId,
        targetColumnId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to move task');
    }
  },
};

/**
 * Team Management API functions
 *
 * Consolidated API for managing team members
 */
export const teamManagementApi = {
  // Generic fetcher for SWR
  fetcher: async (url: string) => {
    return fetchAPI(url);
  },

  getTeamMembers: async (projectId?: string, page = 1, limit = 10, search?: string) => {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);

    return fetchAPI(`/api/team-management?${params.toString()}`);
  },

  getTeamMember: async (id: string) => {
    return fetchAPI(`/api/team-management/${id}`);
  },

  getUserTeamMemberships: async (userId: string, page = 1, limit = 10) => {
    try {
      devLog(`Fetching team memberships for user: ${userId}`);
      const params = new URLSearchParams();
      params.append('userId', userId);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await fetchAPI(`/api/team-management?${params.toString()}`);
      devLog(`Team memberships response:`, response);

      return response.teamMembers || [];
    } catch (error) {
      console.error(`Error fetching team memberships for user ${userId}:`, error);
      // Return empty array on error to prevent UI crashes
      return [];
    }
  },

  addTeamMember: async (teamMember: any) => {
    return fetchAPI('/api/team-management', {
      method: 'POST',
      body: JSON.stringify(teamMember),
    });
  },

  removeTeamMember: async (id: string) => {
    return fetchAPI(`/api/team-management/${id}`, {
      method: 'DELETE',
    });
  },

  checkProjectMembership: async (projectId: string) => {
    return fetchAPI(`/api/team-management/membership?projectId=${projectId}`);
  },
};

/**
 * Event API functions
 */
export const eventApi = {
  getEvents: async (projectId?: string, page = 1, limit = 10) => {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return fetchAPI(`/api/events?${params.toString()}`);
  },

  getEvent: async (id: string) => {
    return fetchAPI(`/api/events/${id}`);
  },

  createEvent: async (event: any) => {
    return fetchAPI('/api/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },

  updateEvent: async (id: string, event: any) => {
    return fetchAPI(`/api/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(event),
    });
  },

  deleteEvent: async (id: string) => {
    return fetchAPI(`/api/events/${id}`, {
      method: 'DELETE',
    });
  },
};
