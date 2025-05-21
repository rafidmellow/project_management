/**
 * Service Types
 *
 * This file contains type definitions for service classes and utility functions.
 * Following Next.js 15 documentation standards for type definitions.
 */

import { Role, Permission, RolePermission } from './permission';

/**
 * Permission Cache Entry
 */
export interface PermissionCacheEntry {
  hasPermission: boolean;
  timestamp: number;
}

/**
 * Role Cache Entry
 */
export interface RoleCacheEntry {
  role: Role & {
    permissions: (RolePermission & {
      permission: Permission;
    })[];
  };
  timestamp: number;
}

/**
 * Permission List Cache Entry
 */
export interface PermissionListCacheEntry {
  permissions: string[];
  timestamp: number;
}

/**
 * UI Permission
 */
export interface UiPermission {
  id: string;
  name: string;
  description: string;
  category?: string | null;
}

/**
 * Geo Location Result
 */
export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

/**
 * Location Name Result
 */
export interface LocationNameResult {
  display_name: string;
  address: {
    road?: string;
    street?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    province?: string;
    country?: string;
    postcode?: string;
  };
}

/**
 * Task Include Options
 */
export interface TaskIncludeOptions {
  depth: number;
  includeActivities: boolean;
  maxActivities?: number;
  includeComments?: boolean;
  maxComments?: number;
  includeAttachments?: boolean;
}

/**
 * Calculate Total Hours Options
 */
export interface CalculateTotalHoursOptions {
  isAutoCheckout?: boolean;
  applyWorkdayBounds?: boolean;
  maxHoursPerDay?: number;
  workStartHour?: number;
  workEndHour?: number;
}

/**
 * Date Range
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Profile Data Result
 */
export interface ProfileDataResult<T> {
  data: T | null;
  error: string | null;
}
