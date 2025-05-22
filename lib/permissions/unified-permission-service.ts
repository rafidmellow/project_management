// lib/permissions/unified-permission-service.ts
// Unified Permission Service that exclusively uses database models

import prisma from '@/lib/prisma';
import { Session } from 'next-auth';
import {
  PermissionCacheEntry,
  PermissionListCacheEntry,
  RoleCacheEntry,
  UiPermission,
} from '@/types/service';

/**
 * Unified Permission Service
 *
 * This service provides a centralized way to check permissions across the application.
 * It exclusively uses database models for permission checks with no hardcoded fallbacks.
 * It implements caching for performance optimization.
 */
export class PermissionService {
  // Cache for permission checks to reduce database queries
  private static permissionCache: Record<string, boolean> = {};
  private static permissionListCache: Record<string, string[]> = {};
  private static roleCache: Record<string, any> = {};
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Clear the permission cache
   * This should be called whenever permissions are updated
   */
  static clearCache(): void {
    this.permissionCache = {};
    this.permissionListCache = {};
    this.roleCache = {};
    this.cacheTimestamp = 0;
  }

  /**
   * Check if a user has a specific permission based on their role
   *
   * @deprecated Use hasPermissionById instead for better security and flexibility
   * @param role The user's role
   * @param permission The permission to check
   * @returns A promise that resolves to true if the user has the permission, false otherwise
   */
  static async hasPermission(role: string, permission: string): Promise<boolean> {
    try {
      // Special case for admin role - always has all permissions
      if (role === 'admin') {
        return true;
      }

      // Check cache first
      const cacheKey = `role:${role}:${permission}`;
      const now = Date.now();

      // If cache is valid and has this permission check, return it
      if (now - this.cacheTimestamp < this.CACHE_TTL && cacheKey in this.permissionCache) {
        return this.permissionCache[cacheKey];
      }

      // Get the role from the database
      const roleRecord = await prisma.role.findUnique({
        where: { name: role },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!roleRecord) {
        // Role doesn't exist in the database
        this.permissionCache[cacheKey] = false;
        return false;
      }

      // Check if the role has the permission
      const hasPermission = roleRecord.permissions.some(rp => rp.permission.name === permission);

      // Update cache
      this.permissionCache[cacheKey] = hasPermission;
      this.cacheTimestamp = now;

      return hasPermission;
    } catch (error) {
      console.error(`Error checking permission ${permission} for role ${role}:`, error);
      return false;
    }
  }

  /**
   * Check if a user has a specific permission based on their user ID
   * This is the preferred method for checking permissions
   *
   * @param userId The user's ID
   * @param permission The permission to check
   * @returns A promise that resolves to true if the user has the permission, false otherwise
   */
  static async hasPermissionById(userId: string, permission: string): Promise<boolean> {
    try {
      // Check cache first
      const cacheKey = `user:${userId}:${permission}`;
      const now = Date.now();

      // If cache is valid and has this permission check, return it
      if (now - this.cacheTimestamp < this.CACHE_TTL && cacheKey in this.permissionCache) {
        return this.permissionCache[cacheKey];
      }

      // Get the user with their role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          id: true,
        },
      });

      if (!user) {
        this.permissionCache[cacheKey] = false;
        return false;
      }

      // Special case for admin role - always has all permissions
      if (user.role === 'admin') {
        this.permissionCache[cacheKey] = true;
        return true;
      }

      // Get the role from the database with its permissions
      const roleRecord = await prisma.role.findUnique({
        where: { name: user.role },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!roleRecord) {
        // Role doesn't exist in the database
        this.permissionCache[cacheKey] = false;
        return false;
      }

      // Check if the role has the permission
      const hasPermission = roleRecord.permissions.some(rp => rp.permission.name === permission);

      // Update cache
      this.permissionCache[cacheKey] = hasPermission;
      this.cacheTimestamp = now;

      return hasPermission;
    } catch (error) {
      console.error(`Error checking permission ${permission} for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get all permissions for a role
   *
   * @param role The role name
   * @returns A promise that resolves to an array of permission strings
   */
  static async getPermissionsForRole(role: string): Promise<string[]> {
    try {
      // Check cache first
      const cacheKey = `role_permissions:${role}`;
      const now = Date.now();

      // If cache is valid and has this role's permissions, return them
      if (now - this.cacheTimestamp < this.CACHE_TTL && cacheKey in this.permissionListCache) {
        return this.permissionListCache[cacheKey];
      }

      // Get the role from the database
      const roleRecord = await prisma.role.findUnique({
        where: { name: role },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!roleRecord) {
        // Role doesn't exist in the database
        this.permissionListCache[cacheKey] = [];
        return [];
      }

      // Extract permission names
      const permissions = roleRecord.permissions.map(rp => rp.permission.name);

      // Update cache
      this.permissionListCache[cacheKey] = permissions;
      this.cacheTimestamp = now;

      return permissions;
    } catch (error) {
      console.error(`Error getting permissions for role ${role}:`, error);
      return [];
    }
  }

  /**
   * Get all permissions for a user based on their user ID
   *
   * @param userId The user's ID
   * @returns A promise that resolves to an array of permission strings
   */
  static async getPermissionsForUser(userId: string): Promise<string[]> {
    try {
      // Get the user to check their role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        return [];
      }

      // Use the database-backed permission system to get permissions for the role
      return await this.getPermissionsForRole(user.role);
    } catch (error) {
      console.error(`Error getting permissions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get all available roles
   *
   * @returns A promise that resolves to an array of role objects
   */
  static async getAllRoles(): Promise<
    { id: string; name: string; description: string; color: string }[]
  > {
    try {
      // Check cache first
      const now = Date.now();

      // If cache is valid and has roles, return them
      if (now - this.cacheTimestamp < this.CACHE_TTL && 'roles' in this.roleCache) {
        const cachedRoles = this.roleCache['roles'];
        if (Array.isArray(cachedRoles)) {
          return cachedRoles;
        }
      }

      // Get all roles from the database
      const roles = await prisma.role.findMany();

      // Format roles for the UI
      const formattedRoles = roles.map(role => ({
        id: role.name,
        name: role.name
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' '),
        description: role.description || `${role.name} role`,
        color: role.color || 'bg-gray-500',
      }));

      // Update cache
      this.roleCache['roles'] = formattedRoles;
      this.cacheTimestamp = now;

      return formattedRoles;
    } catch (error) {
      console.error('Error getting all roles:', error);
      return [];
    }
  }

  /**
   * Get all available permissions
   *
   * @returns An array of permission objects with id, name, description, and category
   */
  static async getAllPermissions(): Promise<UiPermission[]> {
    try {
      // Check cache first
      const now = Date.now();

      // If cache is valid and has permissions, return them
      if (now - this.cacheTimestamp < this.CACHE_TTL && 'permissions' in this.roleCache) {
        const cachedPermissions = this.roleCache['permissions'];
        if (Array.isArray(cachedPermissions)) {
          return cachedPermissions;
        }
      }

      // Get all permissions from the database
      const permissions = await prisma.permission.findMany();

      // Format permissions for the UI
      const formattedPermissions = permissions.map(p => ({
        id: p.name,
        name: p.name
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' '),
        description: p.description || `Permission to ${p.name.replace(/_/g, ' ')}`,
        category: p.category,
      }));

      // Update cache
      this.roleCache['permissions'] = formattedPermissions;
      this.cacheTimestamp = now;

      return formattedPermissions;
    } catch (error) {
      console.error('Error getting all permissions:', error);
      return [];
    }
  }

  /**
   * Update permissions for all roles
   *
   * @param permissions A record mapping role names to arrays of permission names
   * @returns A promise that resolves to true if the update was successful, false otherwise
   */
  static async updateAllRolePermissions(permissions: Record<string, string[]>): Promise<boolean> {
    try {
      // Get all roles
      const roles = await prisma.role.findMany();

      // For each role, update its permissions
      for (const role of roles) {
        const roleName = role.name;

        // Skip if the role is not in the permissions object
        if (!permissions[roleName]) continue;

        // Get the permissions for this role
        const rolePermissions = permissions[roleName];

        // Delete existing role permissions
        await prisma.rolePermission.deleteMany({
          where: { roleId: role.id },
        });

        // Get the permission records
        const permissionRecords = await prisma.permission.findMany({
          where: {
            name: {
              in: rolePermissions,
            },
          },
        });

        // Create new role permissions
        await Promise.all(
          permissionRecords.map(permission =>
            prisma.rolePermission.create({
              data: {
                roleId: role.id,
                permissionId: permission.id,
              },
            })
          )
        );
      }

      // Clear the permission cache
      this.clearCache();

      return true;
    } catch (error) {
      console.error('Error updating role permissions:', error);
      return false;
    }
  }

  /**
   * Create a new role
   *
   * @param name The name of the role
   * @param description The description of the role
   * @param color Optional color for the role
   * @returns A promise that resolves to the created role
   */
  static async createRole(name: string, description: string, color: string = 'bg-gray-500') {
    try {
      // Check if role already exists
      const existingRole = await prisma.role.findUnique({
        where: { name },
      });

      if (existingRole) {
        throw new Error(`Role '${name}' already exists`);
      }

      // Create the role
      const role = await prisma.role.create({
        data: {
          name,
          description,
          color,
        },
      });

      // Clear the permission cache
      this.clearCache();

      return role;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Delete a role
   *
   * @param name The name of the role to delete
   * @returns A promise that resolves to true if the role was deleted, false otherwise
   */
  static async deleteRole(name: string): Promise<boolean> {
    try {
      // Check if role exists
      const role = await prisma.role.findUnique({
        where: { name },
      });

      if (!role) {
        throw new Error(`Role '${name}' not found`);
      }

      // Delete role permissions first
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id },
      });

      // Delete the role
      await prisma.role.delete({
        where: { id: role.id },
      });

      // Clear the permission cache
      this.clearCache();

      return true;
    } catch (error) {
      console.error('Error deleting role:', error);
      return false;
    }
  }
}
