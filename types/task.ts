/**
 * Task Management Types
 *
 * This file contains all type definitions related to tasks in the application.
 * Following Next.js 15 documentation standards for type definitions.
 */

// Import types from other files to avoid duplication
import { ActivityWithRelations } from './activity';
import { UserSummary } from './user';
import { Document, DocumentWithRelations } from './document';
import type { ProjectStatus } from './project';

// Re-export ProjectStatus for components that need it
export type { ProjectStatus } from './project';

/**
 * Task Priority type
 */
export type TaskPriority = 'low' | 'medium' | 'high';

/**
 * Base Task interface representing the core task data
 */
export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  dueDate?: string | Date;
  projectId: string;
  parentId?: string | null;
  order: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  endDate?: string | Date;
  estimatedTime?: number | null;
  startDate?: string | Date;
  statusId?: string | null;
  timeSpent?: number | null;
  completed: boolean;
  // Optional properties that might be included in some contexts
  assignees?: TaskAssignee[];
  status?: ProjectStatus | null;
  project: {
    id: string;
    title: string;
  };
}

/**
 * Task with related entities
 */
export interface TaskWithRelations extends Task {
  // These properties are already in the Task interface
  // project?: {
  //   id: string;
  //   title: string;
  // };
  // status?: {
  //   id: string;
  //   name: string;
  //   color: string;
  // } | null;
  // assignees?: TaskAssignee[];

  // Additional related entities
  parent?: {
    id: string;
    title: string;
  } | null;
  subtasks?: TaskWithRelations[];
  activities?: ActivityWithRelations[];
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
}

/**
 * Task Assignee interface
 */
export interface TaskAssignee {
  id: string;
  userId: string;
  taskId: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  user: UserSummary;
  // Legacy properties for backward compatibility
  avatar?: string;
  name?: string;
}

/**
 * Subtask interface (simplified task for hierarchical display)
 *
 * This is a simplified version of the Task interface used specifically for
 * hierarchical display of tasks and subtasks. It contains only the essential
 * properties needed for the UI.
 */
export interface Subtask {
  id: string;
  title: string;
  priority: TaskPriority;
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  assignees?: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email?: string;
      image: string | null;
    };
  }[];
  subtasks?: Subtask[];
  parentId?: string | null;
  projectId: string;
  completed: boolean;
  dueDate?: string | Date;
  statusId?: string | null;
  status?: ProjectStatus | null;
}

/**
 * Task Move Operation interface for drag-and-drop
 */
export interface TaskMoveOperation {
  id: string;
  newParentId: string | null;
  oldParentId: string | null;
  newIndex?: number;
  newStatusId?: string | null;
}

/**
 * Comment interface (base model from schema.prisma)
 */
export interface Comment {
  id: string;
  content: string;
  entityType: string;
  entityId: string;
  userId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Comment with related entities
 */
export interface CommentWithRelations extends Comment {
  user: UserSummary;
}

/**
 * Task Comment interface (specialized Comment for tasks)
 */
export interface TaskComment extends CommentWithRelations {
  taskId: string;
}

/**
 * Task Attachment interface (specialized Document for tasks)
 */
export interface TaskAttachment {
  id: string;
  filename: string; // Matches database schema
  fileUrl: string; // Matches database schema
  name?: string; // Alias for filename for compatibility
  filePath?: string; // Alias for fileUrl for compatibility
  fileSize: number;
  fileType: string;
  taskId: string;
  userId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  description?: string | null;
  user: UserSummary;
}

// Helper function to normalize attachment properties
export function normalizeAttachment(attachment: TaskAttachment): TaskAttachment {
  return {
    ...attachment,
    // Ensure both property sets are available
    name: attachment.name || attachment.filename,
    filePath: attachment.filePath || attachment.fileUrl,
    filename: attachment.filename || attachment.name || '',
    fileUrl: attachment.fileUrl || attachment.filePath || '',
  };
}

// Activity interface has been moved to activity.ts
// Use ActivityWithRelations from activity.ts instead

/**
 * Task Creation DTO
 */
export interface CreateTaskDTO {
  title: string;
  description?: string | null;
  priority?: string;
  startDate?: string | null;
  endDate?: string | null;
  dueDate?: string | null;
  estimatedTime?: number | null;
  projectId: string;
  statusId?: string | null;
  parentId?: string | null;
  assigneeIds?: string[];
}

/**
 * Task Update DTO
 */
export interface UpdateTaskDTO {
  title?: string;
  description?: string | null;
  priority?: string;
  startDate?: string | null;
  endDate?: string | null;
  dueDate?: string | null;
  estimatedTime?: number | null;
  timeSpent?: number | null;
  statusId?: string | null;
  toggleCompletion?: boolean;
  assigneeIds?: string[];
  projectId?: string;
  parentId?: string | null;
}

/**
 * Task Filter Options for API requests
 */
export interface TaskFilterOptions {
  projectId?: string;
  statusId?: string;
  assigneeId?: string;
  priority?: string;
  completed?: boolean;
  dueDate?: string;
  search?: string;
  parentId?: string | null;
  sortBy?: 'title' | 'priority' | 'dueDate' | 'createdAt' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Task Filters for UI filtering
 */
export interface TaskFilters {
  search: string;
  statusIds: string[];
  assigneeIds: string[];
  priority: TaskPriority | null;
  completed: boolean | null;
  status?: string;
  assignee?: string;
  dueDate?: string;
  showCompleted?: boolean;
  teamMember?: string;
}

/**
 * Task Comment Creation DTO
 */
export interface CreateTaskCommentDTO {
  content: string;
}

/**
 * Task Attachment Creation DTO
 */
export interface CreateTaskAttachmentDTO {
  file: File;
  description?: string;
}

/**
 * Task API Response
 */
export interface TaskResponse {
  task: TaskWithRelations;
}

/**
 * Tasks List API Response
 */
export interface TasksListResponse {
  tasks: TaskWithRelations[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Task Comments API Response
 */
export interface TaskCommentsResponse {
  comments: TaskComment[];
}

/**
 * Task Attachments API Response
 */
export interface TaskAttachmentsResponse {
  attachments: TaskAttachment[];
}

/**
 * Kanban Column interface for board view
 */
export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  tasks: TaskWithRelations[];
}
