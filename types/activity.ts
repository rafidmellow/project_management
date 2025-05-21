/**
 * Activity Types
 *
 * This file contains all type definitions related to activity logging in the application.
 * Following Next.js 15 documentation standards for type definitions.
 */

import { UserSummary } from './user';

/**
 * Activity interface
 */
export interface Activity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description?: string | null;
  userId: string;
  projectId?: string | null;
  taskId?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

/**
 * Activity with related entities
 */
export interface ActivityWithRelations extends Activity {
  user?: UserSummary;
  project?: {
    id: string;
    title: string;
  } | null;
  task?: {
    id: string;
    title: string;
  } | null;
}

/**
 * Activity where input for filtering
 */
export interface ActivityWhereInput {
  userId?: string;
  projectId?: string;
  taskId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}

/**
 * Activity creation DTO
 */
export interface CreateActivityDTO {
  action: string;
  entityType: string;
  entityId: string;
  description?: string | null;
  userId: string;
  projectId?: string | null;
  taskId?: string | null;
}
