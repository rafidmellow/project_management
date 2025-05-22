// lib/permissions/edge-permission-service.ts
// Edge-compatible Permission Service for middleware

/**
 * Edge-compatible Permission Service
 *
 * This service provides a simplified way to check permissions in edge environments like middleware.
 * It uses permission mappings generated at build time for basic checks without database access.
 * For more complex permission checks, API routes should be used instead.
 *
 * NOTE: This file is updated during the build process with current permission data from the database.
 * Do not modify the ROLE_PERMISSIONS constant directly as changes will be overwritten.
 */
export class EdgePermissionService {
  // Role-permission mappings for edge environments
  // This is populated during build time with data from the database
  // The format is: { 'roleName': ['permission1', 'permission2', ...] }
  private static readonly ROLE_PERMISSIONS: Record<string, string[]> = {
  "admin": [
    "user_management",
    "manage_roles",
    "manage_permissions",
    "project_creation",
    "project_management",
    "project_deletion",
    "team_management",
    "team_add",
    "team_remove",
    "team_view",
    "task_creation",
    "task_assignment",
    "task_management",
    "task_deletion",
    "view_projects",
    "edit_profile",
    "system_settings",
    "view_dashboard",
    "attendance_management",
    "view_team_attendance"
  ],
  "manager": [
    "user_management",
    "project_creation",
    "project_management",
    "project_deletion",
    "team_management",
    "team_add",
    "team_remove",
    "team_view",
    "task_creation",
    "task_assignment",
    "task_management",
    "task_deletion",
    "view_projects",
    "edit_profile",
    "view_dashboard",
    "attendance_management",
    "view_team_attendance"
  ],
  "user": [
    "task_creation",
    "task_management",
    "view_projects",
    "edit_profile",
    "view_dashboard",
    "team_view"
  ],
  "guest": [
    "view_projects",
    "view_dashboard"
  ]
}

  /**
   * Check if a user has a specific permission based on their role
   * This is a simplified version for edge environments
   *
   * @deprecated Use hasPermissionForToken instead when possible
   * @param role The user's role
   * @param permission The permission to check
   * @returns True if the user has the permission, false otherwise
   */
  static hasPermission(role: string, permission: string): boolean {
    try {
      // Get permissions for the role
      const permissions = this.ROLE_PERMISSIONS[role] || [];

      // Check if the role has the permission
      return permissions.includes(permission);
    } catch (error) {
      console.error(`Error checking permission ${permission} for role ${role}:`, error);
      return false;
    }
  }

  /**
   * Check if a user has a specific permission based on their JWT token
   * This is the preferred method for checking permissions in edge environments
   *
   * @param token The user's JWT token with role information
   * @param permission The permission to check
   * @returns True if the user has the permission, false otherwise
   */
  static hasPermissionForToken(token: { role?: string }, permission: string): boolean {
    try {
      if (!token || !token.role) {
        return false;
      }

      const role = token.role as string;
      return this.hasPermission(role, permission);
    } catch (error) {
      console.error(`Error checking permission ${permission} for token:`, error);
      return false;
    }
  }

  /**
   * Get all permissions for a role
   * This is a simplified version for edge environments
   *
   * @deprecated Use getPermissionsForToken instead when possible
   * @param role The role name
   * @returns An array of permission strings
   */
  static getPermissionsForRole(role: string): string[] {
    try {
      // Get permissions for the role
      return this.ROLE_PERMISSIONS[role] || [];
    } catch (error) {
      console.error(`Error getting permissions for role ${role}:`, error);
      return [];
    }
  }

  /**
   * Get all permissions for a user based on their JWT token
   * This is the preferred method for getting permissions in edge environments
   *
   * @param token The user's JWT token with role information
   * @returns An array of permission strings
   */
  static getPermissionsForToken(token: { role?: string }): string[] {
    try {
      if (!token || !token.role) {
        return [];
      }

      const role = token.role as string;
      return this.getPermissionsForRole(role);
    } catch (error) {
      console.error(`Error getting permissions for token:`, error);
      return [];
    }
  }
}
