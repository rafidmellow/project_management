/**
 * API Types
 *
 * This file contains all type definitions related to API routes, middleware, and requests/responses.
 * Following Next.js 15 documentation standards for type definitions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Session } from 'next-auth';

/**
 * Permission Check function type
 */
export type PermissionCheckFn = (
  resourceId: string,
  session: Session | null,
  action?: string | undefined
) => Promise<{
  hasPermission: boolean;
  error?: string | null | undefined;
  task?: any;
  teamMember?: any;
  project?: any;
}>;

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
}

/**
 * Pagination result
 */
export interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Sort parameters
 */
export interface SortParams {
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * API Error response
 */
export interface ApiError {
  error: string;
  details?: Record<string, any>;
  code?: string;
}

/**
 * Activity Log Parameters
 */
export interface ActivityLogParams {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  description?: string | null;
  projectId?: string | null;
  taskId?: string | null;
}

/**
 * Cache Key Generator Function
 */
export type CacheKeyGenerator = (...args: any[]) => string;
