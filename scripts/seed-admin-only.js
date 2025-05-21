// scripts/seed-admin-only.js
// Script to seed the database with only admin user and permissions
/* eslint-disable no-console */

import { PrismaClient } from '../prisma/generated/client/index.js';
import { hash } from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Define roles
const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  GUEST: 'guest',
};

// Define all available permissions
const PERMISSIONS = {
  // User management
  USER_MANAGEMENT: 'user_management',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_PERMISSIONS: 'manage_permissions',
  USER_DELETE: 'user_delete',

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

// Permission matrix - which roles have which permissions
const PERMISSION_MATRIX = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // Admin has all permissions
};

// Helper function to get all permissions with metadata
function getAllPermissionsWithMetadata() {
  return Object.entries(PERMISSIONS).map(([key, value]) => {
    // Determine category based on the permission key
    let category = 'General';
    if (key.includes('USER') || key.includes('ROLE')) {
      category = 'User Management';
    } else if (key.includes('PROJECT')) {
      category = 'Project Management';
    } else if (key.includes('TASK')) {
      category = 'Task Management';
    } else if (key.includes('TEAM')) {
      category = 'Team Management';
    } else if (key.includes('ATTENDANCE')) {
      category = 'Attendance';
    } else if (key.includes('SYSTEM')) {
      category = 'System';
    }

    return {
      id: value,
      name: key,
      description: `Permission to ${value.replace(/_/g, ' ')}`,
      category,
    };
  });
}

async function main() {
  console.log('Starting admin-only seed...');

  try {
    // Clear existing data
    await clearExistingData();

    // Seed roles and permissions
    const roles = await seedRoles();
    const permissions = await seedPermissions();
    await seedRolePermissions(roles, permissions);

    // Seed admin user
    await seedAdminUser();

    // Update edge permissions
    await updateEdgePermissions();

    console.log('Admin-only seed completed successfully');
  } catch (error) {
    console.error('Error during admin-only seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Clear existing data - be careful with this in production!
async function clearExistingData() {
  console.log('Clearing existing data...');

  // Delete dependent records first to avoid foreign key constraints
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.taskAttachment.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.taskAssignee.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.projectStatus.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.attendanceSettings.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Existing data cleared');
}

// Seed roles
async function seedRoles() {
  console.log('Seeding roles...');

  const roleMap = {};

  // Only create the admin role
  const adminRole = await prisma.role.create({
    data: {
      name: ROLES.ADMIN.toLowerCase(),
      description: 'Administrator with full system access',
      color: '#FF0000', // Red color for admin
    },
  });

  roleMap[ROLES.ADMIN.toLowerCase()] = adminRole;

  console.log('Roles seeded');
  return roleMap;
}

// Seed permissions
async function seedPermissions() {
  console.log('Seeding permissions...');

  const permissionMap = {};

  // Get all permissions with metadata
  const allPermissions = getAllPermissionsWithMetadata();

  // Create permissions
  for (const permission of allPermissions) {
    const createdPermission = await prisma.permission.create({
      data: {
        name: permission.id,
        description: permission.description,
        category: permission.category,
      },
    });

    permissionMap[permission.id] = createdPermission;
  }

  console.log('Permissions seeded');
  return permissionMap;
}

// Seed role-permission relationships
async function seedRolePermissions(roles, permissions) {
  console.log('Assigning permissions to roles...');

  // For each role in the permission matrix
  for (const [roleKey, permissionList] of Object.entries(PERMISSION_MATRIX)) {
    const role = roles[roleKey.toLowerCase()];

    if (!role) {
      continue;
    }

    // For each permission assigned to this role
    for (const permissionKey of permissionList) {
      const permission = permissions[permissionKey];

      if (!permission) {
        continue;
      }

      // Create the role-permission relationship
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log('Role permissions assigned');
}

// Seed admin user
async function seedAdminUser() {
  console.log('Creating admin user...');

  const hashedPassword = await hash('admin123', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      department: 'Administration',
      jobTitle: 'System Administrator',
      bio: 'System administrator with full access to all features',
      location: 'Headquarters',
      phone: '555-ADMIN',
      skills: 'System Administration, User Management',
      active: true,
    },
  });

  console.log(`Admin user created with ID: ${adminUser.id}`);
  return adminUser;
}

// Update edge permissions
async function updateEdgePermissions() {
  console.log('Updating edge permissions...');

  try {
    // Get all roles with their permissions
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Create a mapping of role names to permission names
    const rolePermissions = {};

    roles.forEach((role) => {
      rolePermissions[role.name] = role.permissions.map(
        (rp) => rp.permission.name,
      );
    });

    console.log('Edge permissions prepared for update');
    return rolePermissions;
  } catch (error) {
    console.error('Error preparing edge permissions:', error);
    return null;
  }
}

// Run the main function
main()
  .then(() => {
    console.log('Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error during seed:', error);
    process.exit(1);
  });
