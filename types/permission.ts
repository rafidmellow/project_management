/**
 * Permission System Types
 *
 * This file contains all type definitions related to roles and permissions in the application.
 * Following Next.js 15 documentation standards for type definitions.
 */

/**
 * Role interface
 */
export interface Role {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Role with permissions
 */
export interface RoleWithPermissions extends Role {
  permissions: Permission[] | RolePermission[];
  _count?: {
    permissions: number;
  };
}

/**
 * Permission interface
 */
export interface Permission {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Permission with roles
 */
export interface PermissionWithRoles extends Permission {
  roles: Role[] | RolePermission[];
  _count?: {
    roles: number;
  };
}

/**
 * Role-Permission relationship
 */
export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  role?: Role;
  permission?: Permission;
}

/**
 * System Role type (predefined roles)
 */
export type SystemRole = 'admin' | 'manager' | 'user' | 'guest';

/**
 * System Role Definition
 */
export interface SystemRoleDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
}

/**
 * Permission Category
 */
export type PermissionCategory =
  | 'dashboard'
  | 'user_management'
  | 'project_management'
  | 'task_management'
  | 'team_management'
  | 'attendance'
  | 'settings';

/**
 * Permission Check Result
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  error?: string;
}

/**
 * Role Creation DTO
 */
export interface CreateRoleDTO {
  name: string;
  description?: string;
  color?: string;
  permissions?: string[]; // Array of permission IDs
}

/**
 * Role Update DTO
 */
export interface UpdateRoleDTO {
  name?: string;
  description?: string | null;
  color?: string | null;
  permissions?: string[]; // Array of permission IDs
}

/**
 * Permission Creation DTO
 */
export interface CreatePermissionDTO {
  name: string;
  description?: string;
  category?: string;
}

/**
 * Permission Update DTO
 */
export interface UpdatePermissionDTO {
  name?: string;
  description?: string | null;
  category?: string | null;
}

/**
 * Role-Permission Assignment DTO
 */
export interface AssignPermissionDTO {
  roleId: string;
  permissionId: string;
}

/**
 * Role API Response
 */
export interface RoleResponse {
  role: RoleWithPermissions;
}

/**
 * Roles List API Response
 */
export interface RolesListResponse {
  roles: RoleWithPermissions[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Permission API Response
 */
export interface PermissionResponse {
  permission: PermissionWithRoles;
}

/**
 * Permissions List API Response
 */
export interface PermissionsListResponse {
  permissions: Permission[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Permission Matrix Item
 */
export interface PermissionMatrixItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  roles: {
    [key: string]: boolean;
  };
}
