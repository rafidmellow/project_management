/**
 * Project Management Types
 *
 * This file contains all type definitions related to projects in the application.
 * Following Next.js 15 documentation standards for type definitions.
 */

// Import UserSummary from user.ts to avoid duplication
import { UserSummary } from './user';

/**
 * Base Project interface representing the core project data
 */
export interface Project {
  id: string;
  title: string;
  description?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  dueDate?: string | Date | null;
  estimatedTime?: number | null;
  totalTimeSpent?: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdById: string;
  // Include properties that are used in components but were missing
  _count?: {
    tasks: number;
    teamMembers: number;
    statuses?: number;
  };
  teamMembers?: TeamMember[];
  createdBy?: UserSummary;
}

/**
 * Extended Project interface with related entities
 */
export interface ProjectWithRelations extends Project {
  statuses?: ProjectStatus[];
  tasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
    statusId?: string | null;
  }>;
  // Virtual properties for UI
  completedTasks?: number;
  progress?: number;
}

/**
 * Project Status interface
 */
export interface ProjectStatus {
  id: string;
  name: string;
  color: string;
  description?: string | null;
  isDefault: boolean;
  isCompletedStatus?: boolean;
  order: number;
  projectId: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/**
 * Team Member interface
 */
export interface TeamMember {
  id: string;
  projectId: string;
  userId: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  user?: UserSummary;
}

// UserSummary is now imported from user.ts

/**
 * Project Member interface for simplified team representation
 */
export interface ProjectMember {
  id: string;
  name?: string | null;
  image?: string | null;
}

/**
 * Project Summary interface for dashboard and list views
 */
export interface ProjectSummary {
  id: string;
  title: string;
  description?: string | null;
  createdBy?: {
    id: string;
    name?: string | null;
  };
  teamCount: number;
  taskCount: number;
  completedTaskCount: number;
  progress: number;
  team: ProjectMember[];
}

/**
 * Project Creation DTO
 */
export interface CreateProjectDTO {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  estimatedTime?: number;
  statuses?: Omit<ProjectStatus, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[];
}

/**
 * Project Update DTO
 */
export interface UpdateProjectDTO {
  title?: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  dueDate?: string | null;
  estimatedTime?: number | null;
  totalTimeSpent?: number | null;
}

/**
 * Project Filter Options
 */
export interface ProjectFilterOptions {
  search?: string;
  createdById?: string;
  teamMemberId?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate' | 'dueDate';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Project Status Creation DTO
 */
export interface CreateProjectStatusDTO {
  name: string;
  color: string;
  description?: string;
  isDefault?: boolean;
  isCompletedStatus?: boolean;
  order?: number;
  projectId: string;
}

/**
 * Project Status Update DTO
 */
export interface UpdateProjectStatusDTO {
  name?: string;
  color?: string;
  description?: string | null;
  isDefault?: boolean;
  isCompletedStatus?: boolean;
  order?: number;
}

/**
 * Project API Response
 */
export interface ProjectResponse {
  project: ProjectWithRelations;
}

/**
 * Projects List API Response
 */
export interface ProjectsListResponse {
  projects: ProjectWithRelations[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Project Status API Response
 */
export interface ProjectStatusResponse {
  status: ProjectStatus;
}

/**
 * Project Statuses List API Response
 */
export interface ProjectStatusesListResponse {
  statuses: ProjectStatus[];
}

/**
 * Project Event interface
 */
export interface ProjectEvent {
  id: string;
  title: string;
  description?: string | null;
  date: string | Date;
  projectId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
