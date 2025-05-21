// scripts/seed-permissions.js
// Script to seed the database with roles and permissions
/* eslint-env node */
/* eslint-disable no-undef, no-console */

import { PrismaClient } from '../prisma/generated/client/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Define all available permissions
const PERMISSIONS = {
  // User management
  USER_MANAGEMENT: 'user_management',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_PERMISSIONS: 'manage_permissions',

  // Project management
  PROJECT_CREATION: 'project_creation',
  PROJECT_MANAGEMENT: 'project_management',
  PROJECT_DELETION: 'project_deletion',

  // Team management
  TEAM_MANAGEMENT: 'team_management',
  TEAM_ADD: 'team_add',
  TEAM_REMOVE: 'team_remove',
  TEAM_VIEW: 'team_view',

  // Task management
  TASK_CREATION: 'task_creation',
  TASK_ASSIGNMENT: 'task_assignment',
  TASK_MANAGEMENT: 'task_management',
  TASK_DELETION: 'task_deletion',

  // General permissions
  VIEW_PROJECTS: 'view_projects',
  EDIT_PROFILE: 'edit_profile',
  SYSTEM_SETTINGS: 'system_settings',
  VIEW_DASHBOARD: 'view_dashboard',

  // Attendance
  ATTENDANCE_MANAGEMENT: 'attendance_management',
  VIEW_TEAM_ATTENDANCE: 'view_team_attendance',
};

// Define system roles with additional metadata
const SYSTEM_ROLES = {
  admin: {
    name: 'Administrator',
    description: 'Full access to all system features',
    color: 'bg-purple-500', // Purple
  },
  manager: {
    name: 'Manager',
    description: 'Can manage projects, tasks, and team members',
    color: 'bg-blue-500', // Blue
  },
  user: {
    name: 'User',
    description: 'Regular user with limited permissions',
    color: 'bg-green-500', // Green
  },
  guest: {
    name: 'Guest',
    description: 'View-only access to projects',
    color: 'bg-gray-500', // Gray
  },
};

// Define role-permission mappings
const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS), // Admin has all permissions
  manager: [
    // User management (limited)
    PERMISSIONS.USER_MANAGEMENT,

    // Project management
    PERMISSIONS.PROJECT_CREATION,
    PERMISSIONS.PROJECT_MANAGEMENT,
    PERMISSIONS.PROJECT_DELETION,

    // Team management
    PERMISSIONS.TEAM_MANAGEMENT,
    PERMISSIONS.TEAM_ADD,
    PERMISSIONS.TEAM_REMOVE,
    PERMISSIONS.TEAM_VIEW,

    // Task management
    PERMISSIONS.TASK_CREATION,
    PERMISSIONS.TASK_ASSIGNMENT,
    PERMISSIONS.TASK_MANAGEMENT,
    PERMISSIONS.TASK_DELETION,

    // General permissions
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.VIEW_DASHBOARD,

    // Attendance
    PERMISSIONS.ATTENDANCE_MANAGEMENT,
    PERMISSIONS.VIEW_TEAM_ATTENDANCE,
  ],
  user: [
    // Task management (limited)
    PERMISSIONS.TASK_CREATION,
    PERMISSIONS.TASK_MANAGEMENT,

    // General permissions
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.TEAM_VIEW,
  ],
  guest: [
    // General permissions
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.VIEW_DASHBOARD,
  ],
};

// Function to categorize permissions
function categorizePermission(permission) {
  if (permission.includes('USER') || permission.includes('ROLE')) {
    return 'User Management';
  } else if (permission.includes('PROJECT')) {
    return 'Project Management';
  } else if (permission.includes('TASK')) {
    return 'Task Management';
  } else if (permission.includes('TEAM')) {
    return 'Team Management';
  } else if (permission.includes('ATTENDANCE')) {
    return 'Attendance';
  } else if (permission.includes('SYSTEM')) {
    return 'System';
  }
  return 'General';
}

// Main seeding function
async function seedPermissions() {
  console.log('Starting permission seeding...');

  try {
    // Create permissions
    console.log('Creating permissions...');
    for (const [key, value] of Object.entries(PERMISSIONS)) {
      const category = categorizePermission(key);
      const description = `Permission to ${value.replace(/_/g, ' ')}`;

      await prisma.permission.upsert({
        where: { name: value },
        update: {
          description,
          category,
        },
        create: {
          name: value,
          description,
          category,
        },
      });
    }
    console.log('Permissions created successfully');

    // Create roles
    console.log('Creating roles...');
    for (const [key, value] of Object.entries(SYSTEM_ROLES)) {
      await prisma.role.upsert({
        where: { name: key },
        update: {
          description: value.description,
          color: value.color,
        },
        create: {
          name: key,
          description: value.description,
          color: value.color,
        },
      });
    }
    console.log('Roles created successfully');

    // Assign permissions to roles
    console.log('Assigning permissions to roles...');
    for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      // Get the role ID
      const roleRecord = await prisma.role.findUnique({
        where: { name: role },
      });

      if (!roleRecord) {
        console.error(`Role ${role} not found`);
        continue;
      }

      // Delete existing role permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: roleRecord.id },
      });

      // Create new role permissions
      for (const permission of permissions) {
        // Get the permission ID
        const permissionRecord = await prisma.permission.findUnique({
          where: { name: permission },
        });

        if (!permissionRecord) {
          console.error(`Permission ${permission} not found`);
          continue;
        }

        // Create role permission
        await prisma.rolePermission.create({
          data: {
            roleId: roleRecord.id,
            permissionId: permissionRecord.id,
          },
        });
      }
    }
    console.log('Role permissions assigned successfully');

    console.log('Permission seeding completed successfully');
  } catch (error) {
    console.error('Error seeding permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedPermissions()
  .then(() => {
    console.log('Permission seeding completed successfully');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
