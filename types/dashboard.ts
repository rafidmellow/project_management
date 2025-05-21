/**
 * Dashboard Types
 *
 * This file contains all type definitions related to dashboard statistics and summaries.
 * Following Next.js 15 documentation standards for type definitions.
 */

// Import types from project.ts to avoid duplication
import { ProjectMember, ProjectSummary, ProjectStatus } from './project';

// Re-export for convenience
export type { ProjectMember, ProjectSummary };

/**
 * System Statistics interface for admin dashboard
 */
export interface SystemStats {
  totalUsers: number;
  usersByRole: {
    admin: number;
    manager: number;
    user: number;
  };
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

/**
 * Dashboard Statistics interface for main dashboard
 */
export interface DashboardStats {
  totalProjects: number;
  recentProjects: ProjectSummary[];
  projectGrowth: number;
  systemStats: SystemStats | null;
}

/**
 * Project Status Distribution interface for charts
 */
export interface ProjectStatusDistribution {
  notStarted: number;
  inProgress: number;
  completed: number;
}

/**
 * Task Summary interface for dashboard display
 *
 * This is a simplified version of the Task interface used specifically for
 * dashboard display. It contains only the essential properties needed for the UI.
 */
export interface TaskSummary {
  id: string;
  title: string;
  projectTitle: string;
  projectId: string;
  completed: boolean;
  dueDate: string | Date | null;
  priority: 'low' | 'medium' | 'high' | string;
  status?: ProjectStatus | null;
}
