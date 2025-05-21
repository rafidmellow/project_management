/**
 * Centralized role definitions for the application
 * This ensures consistency across all components
 */

// Database role values (used for storage)
export type SystemRole = 'user' | 'manager' | 'admin' | 'guest';

// Role definitions with display names and descriptions
export const SYSTEM_ROLES = {
  admin: {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access to all resources and settings',
    color: 'bg-purple-500',
  },
  manager: {
    id: 'manager',
    name: 'Manager',
    description: 'Can manage users and content but not system settings',
    color: 'bg-green-500',
  },
  user: {
    id: 'user',
    name: 'Regular User',
    description: 'Regular user with limited access',
    color: 'bg-blue-500',
  },
  guest: {
    id: 'guest',
    name: 'Guest',
    description: 'Minimal access for temporary users',
    color: 'bg-gray-500',
  },
};

// Get display name for a role
export function getRoleDisplayName(role: SystemRole): string {
  return SYSTEM_ROLES[role]?.name || 'Unknown Role';
}

// Get all available roles (for dropdowns, etc.)
export function getAvailableRoles(includeGuest: boolean = false): SystemRole[] {
  if (includeGuest) {
    return ['user', 'manager', 'admin', 'guest'];
  }
  return ['user', 'manager', 'admin'];
}

// Get role options for select components
export function getRoleOptions(includeGuest: boolean = false): { value: string; label: string }[] {
  return getAvailableRoles(includeGuest).map(role => ({
    value: role,
    label: SYSTEM_ROLES[role].name,
  }));
}
