import prisma from '@/lib/prisma';

/**
 * Service for managing user roles and permissions
 */
export class PermissionService {
  /**
   * Update a user's role
   * @param userId - The ID of the user to update
   * @param roleName - The new role to assign
   * @returns A boolean indicating success or failure
   */
  static async updateUserRole(userId: string, roleName: string): Promise<boolean> {
    try {
      // Validate that the role is one of the allowed roles
      const validRoles = ['admin', 'manager', 'user', 'guest'];
      if (!validRoles.includes(roleName)) {
        console.error(`Invalid role: ${roleName}`);
        return false;
      }

      // Update the user's role
      await prisma.user.update({
        where: { id: userId },
        data: { role: roleName },
      });

      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  }

  /**
   * Get all available roles in the system
   * @returns An array of role objects
   */
  static async getAllRoles(): Promise<{ id: string; name: string }[]> {
    // Since we're using a simplified role system, we'll return the hardcoded roles
    return [
      { id: 'admin', name: 'Administrator' },
      { id: 'manager', name: 'Manager' },
      { id: 'user', name: 'User' },
      { id: 'guest', name: 'Guest' },
    ];
  }

  /**
   * Get permissions for a specific role
   * @param roleName - The name of the role
   * @returns An array of permission strings
   */
  static getPermissionsForRole(roleName: string): string[] {
    // This is a simplified implementation
    // In a real system, you might fetch this from a database
    switch (roleName) {
      case 'admin':
        return [
          'user:read',
          'user:create',
          'user:update',
          'user:delete',
          'project:read',
          'project:create',
          'project:update',
          'project:delete',
          'task:read',
          'task:create',
          'task:update',
          'task:delete',
          'attendance:read',
          'attendance:create',
          'attendance:update',
          'attendance:delete',
          'settings:read',
          'settings:update',
        ];
      case 'manager':
        return [
          'user:read',
          'project:read',
          'project:create',
          'project:update',
          'task:read',
          'task:create',
          'task:update',
          'task:delete',
          'attendance:read',
          'attendance:create',
          'settings:read',
        ];
      case 'user':
        return [
          'user:read',
          'project:read',
          'task:read',
          'task:create',
          'task:update',
          'attendance:read',
          'attendance:create',
        ];
      case 'guest':
        return ['project:read', 'task:read'];
      default:
        return [];
    }
  }
}
