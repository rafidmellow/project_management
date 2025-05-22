'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { taskApi } from '@/lib/api';
import { Task, TaskAssignee, TaskFilters } from '@/types/task';
import { ProjectStatus } from '@/types/project';
import { UserSummary } from '@/types/user';

interface TaskContextType {
  tasks: Task[];
  statuses: ProjectStatus[];
  isLoading: boolean;
  isTasksLoading: boolean;
  filteredTasks: Task[];
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  refreshTasks: () => Promise<void>;
  updateTask: (taskId: string, data: Partial<Task>) => Promise<void>;
  moveTask: (taskId: string, statusId: string, targetTaskId?: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTaskAssignees: (taskId: string, assigneeIds: string[]) => Promise<void>;
  createTask: (data: any) => Promise<void>;
  editTask: (taskId: string) => void;
  users: UserSummary[];
}

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({
  children,
  projectId,
}: {
  children: React.ReactNode;
  projectId: string;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    statusIds: [],
    assigneeIds: [],
    priority: null,
    completed: null,
  });
  const { toast } = useToast();

  // Fetch statuses
  const fetchStatuses = async () => {
    try {
      // If projectId is "all", fetch all statuses, otherwise filter by projectId
      // We now have two endpoints that handle the "all" case
      const url =
        projectId === 'all' ? `/api/projects/all/statuses` : `/api/projects/${projectId}/statuses`;

      console.log('Fetching statuses from URL:', url);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch statuses');
      const data = await response.json();
      setStatuses(data.statuses || []);
    } catch (error) {
      console.error('Error fetching statuses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project statuses',
        variant: 'destructive',
      });
    }
  };

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setIsTasksLoading(true);
      // If projectId is "all", fetch all tasks, otherwise filter by projectId
      const url =
        projectId === 'all'
          ? `/api/tasks?limit=100`
          : `/api/tasks?projectId=${projectId}&limit=100`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    } finally {
      setIsTasksLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      // If projectId is "all", fetch all users, otherwise filter by projectId
      const url =
        projectId === 'all'
          ? `/api/team-management/all?limit=100`
          : `/api/team-management?projectId=${projectId}`;

      console.log('Fetching users from URL:', url);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();

      if (projectId === 'all') {
        // For "all" projectId, extract users from team members
        if (data.teamMembers && Array.isArray(data.teamMembers)) {
          // Extract unique users from team members
          const userMap = new Map();
          data.teamMembers.forEach((tm: any) => {
            if (tm.user && tm.user.id) {
              userMap.set(tm.user.id, tm.user);
            }
          });
          setUsers(Array.from(userMap.values()));
        } else {
          setUsers([]);
        }
      } else {
        // Extract user data from team members for specific project
        if (data.teamMembers && Array.isArray(data.teamMembers)) {
          const users = data.teamMembers
            .map((tm: any) => tm.user)
            .filter((user: any) => user && user.id);
          setUsers(users);
        } else {
          setUsers([]);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    }
  };

  // Fetch all data
  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchStatuses(), fetchTasks(), fetchUsers()]);
    setIsLoading(false);
  };
  // Filter tasks based on current filters with improved performance
  const filteredTasks = useMemo(() => {
    if (tasks.length === 0) return [];

    // Create search terms for faster filtering
    const searchLower = filters.search ? filters.search.toLowerCase() : '';
    const statusSet = new Set(filters.statusIds);
    const assigneeSet = new Set(filters.assigneeIds);

    // Use a single pass through the array for all filters
    return tasks.filter(task => {
      // Search filter - only run this check if we have a search term
      if (searchLower && !task.title.toLowerCase().includes(searchLower)) {
        return false;
      }

      // Status filter - only run this check if we have status filters
      if (statusSet.size > 0 && task.statusId && !statusSet.has(task.statusId)) {
        return false;
      }

      // Assignee filter - only run this check if we have assignee filters
      if (assigneeSet.size > 0) {
        const taskAssigneeIds = task.assignees?.map(a => a.user.id) || [];
        if (!taskAssigneeIds.some(id => assigneeSet.has(id))) {
          return false;
        }
      }

      // Priority filter
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      // Completion filter
      if (filters.completed !== null && task.completed !== filters.completed) {
        return false;
      }

      return true;
    });
  }, [tasks, filters]);

  // Task operations
  const updateTask = async (taskId: string, data: Partial<Task>) => {
    // Optimistic update
    setTasks(prev => prev.map(task => (task.id === taskId ? { ...task, ...data } : task)));

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update task');

      toast({
        title: 'Task updated',
        description: 'Task has been updated successfully',
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
      // Revert optimistic update on error
      await fetchTasks();
    }
  };

  const moveTask = async (taskId: string, statusId: string, targetTaskId?: string) => {
    // Find the task being moved
    const taskToMove = tasks.find(t => t.id === taskId);
    if (!taskToMove) {
      toast({
        title: 'Error',
        description: `Task with ID ${taskId} not found`,
        variant: 'destructive',
      });
      return;
    }

    // Find the target status
    const targetStatus = statuses.find(s => s.id === statusId);
    if (!targetStatus) {
      toast({
        title: 'Error',
        description: `Status with ID ${statusId} not found`,
        variant: 'destructive',
      });
      return;
    }

    // Store original state for potential rollback
    const originalTasks = [...tasks];

    // Determine if this is a status change
    const oldStatusId = taskToMove.statusId;
    const isStatusChange = oldStatusId !== statusId;

    // Calculate order if we have a target task
    let order: number | undefined = undefined;
    if (targetTaskId) {
      const targetTask = tasks.find(t => t.id === targetTaskId);
      if (targetTask) {
        // Use the target task's order as a reference
        order = targetTask.order;
      }
    }

    // Optimistic update in the UI
    setTasks(prev => {
      // Create a new array with the task moved to its new position
      return prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            statusId,
            // Also update the completed state based on the target status
            completed: targetStatus.isCompletedStatus ?? task.completed,
          };
        }
        return task;
      });
    });

    try {
      // If the status changed, update the task status with proper order
      if (isStatusChange) {
        const statusResponse = await fetch(`/api/tasks/${taskId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            statusId,
            order, // Include order if we have it
          }),
        });

        if (!statusResponse.ok) {
          const errorData = await statusResponse
            .json()
            .catch(() => ({ error: 'Failed to update task status' }));
          throw new Error(errorData.error || 'Failed to update task status');
        }
      }
      // If just reordering within the same status
      else if (targetTaskId) {
        // Handle reordering within the same status
        const response = await fetch('/api/tasks/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId,
            newParentId: null,
            oldParentId: null,
            targetTaskId,
            isSameParentReorder: true,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to reorder task');
        }
      }

      // Show appropriate toast message
      if (isStatusChange) {
        toast({
          title: 'Task moved',
          description: `Task moved to ${targetStatus.name}`,
        });
      } else if (targetTaskId) {
        toast({
          title: 'Task reordered',
          description: 'Task position updated',
        });
      }

      // Refresh to get the updated order and ensure consistency
      await fetchTasks();
    } catch (error) {
      // Detailed error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error('Error moving task:', errorMessage);

      toast({
        title: 'Error',
        description: `Failed to move task: ${errorMessage}`,
        variant: 'destructive',
      });

      // Revert to original state
      setTasks(originalTasks);

      // Refresh from server to ensure consistency
      await fetchTasks();
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    // Find the task
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      toast({
        title: 'Error',
        description: `Task with ID ${taskId} not found`,
        variant: 'destructive',
      });
      return;
    }

    // Store original state for potential rollback
    const originalTasks = [...tasks];

    // Optimistic update - toggle the completed field and potentially update status
    const newCompleted = !task.completed;

    // Find appropriate status based on new completion state
    const targetStatus = statuses.find(
      s =>
        s.isCompletedStatus === newCompleted &&
        (s.isDefault || (!newCompleted && task.statusId === s.id))
    );

    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            completed: newCompleted,
            // If we found an appropriate status, update it as well
            statusId: targetStatus ? targetStatus.id : t.statusId,
          };
        }
        return t;
      })
    );

    try {
      // Use the toggle-completion endpoint
      const response = await fetch(`/api/tasks/${taskId}/toggle-completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update task');
      }

      // Get the updated task
      const data = await response.json();
      const updatedTask = data.task;

      // Show success message
      toast({
        title: `Task marked as ${updatedTask.completed ? 'completed' : 'incomplete'}`,
        description: updatedTask.status
          ? `Task moved to "${updatedTask.status.name}" status`
          : 'Task status updated successfully',
      });

      // Refresh tasks to ensure UI is in sync with server
      await fetchTasks();
    } catch (error) {
      // Detailed error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error('Error toggling task completion:', errorMessage);

      toast({
        title: 'Error',
        description: `Failed to update task: ${errorMessage}`,
        variant: 'destructive',
      });

      // Revert to original state
      setTasks(originalTasks);

      // Refresh from server to ensure consistency
      await fetchTasks();
    }
  };

  const deleteTask = async (taskId: string) => {
    // Optimistic update
    setTasks(prev => prev.filter(task => task.id !== taskId));

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete task');

      toast({
        title: 'Task deleted',
        description: 'Task has been deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
      // Revert optimistic update on error
      await fetchTasks();
    }
  };

  const updateTaskAssignees = async (taskId: string, assigneeIds: string[]) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeIds }),
      });

      if (!response.ok) throw new Error('Failed to update task assignees');

      // Refresh tasks to get updated assignees
      await fetchTasks();

      toast({
        title: 'Assignees updated',
        description: 'Task assignees have been updated',
      });
    } catch (error) {
      console.error('Error updating assignees:', error);
      toast({
        title: 'Error',
        description: 'Failed to update assignees',
        variant: 'destructive',
      });
    }
  };

  const createTask = async (data: any) => {
    try {
      const response = await fetch(`/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create task');

      // Refresh tasks
      await fetchTasks();

      toast({
        title: 'Task created',
        description: 'New task has been created',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
    }
  };

  // Function to trigger task editing
  const editTask = (taskId: string) => {
    // This will be implemented by the parent component
    // We just provide the method signature here
  };

  // Initial data load
  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  // Listen for refresh events from task form
  useEffect(() => {
    const handleRefreshTasks = (event: any) => {
      // Check if this event is for our project
      if (event.detail?.projectId === projectId) {
        console.log('TaskContext received refresh event for project:', projectId);
        fetchTasks();
      }
    };

    // Add event listener
    window.addEventListener('refreshTasks', handleRefreshTasks);

    // Clean up
    return () => {
      window.removeEventListener('refreshTasks', handleRefreshTasks);
    };
  }, [projectId]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        statuses,
        isLoading,
        isTasksLoading,
        filteredTasks,
        filters,
        setFilters,
        refreshTasks: fetchTasks,
        updateTask,
        moveTask,
        toggleTaskCompletion,
        deleteTask,
        updateTaskAssignees,
        createTask,
        editTask,
        users,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}
