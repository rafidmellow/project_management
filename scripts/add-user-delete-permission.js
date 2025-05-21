// Script to add the user_delete permission to the database
// Run with: node scripts/add-user-delete-permission.js

import { PrismaClient } from '@prisma/client';
console.log('Initializing PrismaClient...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function addUserDeletePermission() {
  console.log('Starting to add user_delete permission...');

  try {
    // Check if the permission already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { name: 'user_delete' },
    });

    if (existingPermission) {
      console.log('Permission user_delete already exists, skipping creation.');
    } else {
      // Create the permission
      await prisma.permission.create({
        data: {
          name: 'user_delete',
          description: 'Permission to delete users',
          category: 'User Management',
        },
      });
      console.log('Created user_delete permission successfully.');
    }

    // Get the permission ID
    const permission = await prisma.permission.findUnique({
      where: { name: 'user_delete' },
      select: { id: true },
    });

    if (!permission) {
      throw new Error('Failed to find user_delete permission after creation');
    }

    // Get admin and manager roles
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' },
      select: { id: true },
    });

    const managerRole = await prisma.role.findUnique({
      where: { name: 'manager' },
      select: { id: true },
    });

    if (!adminRole) {
      throw new Error('Admin role not found');
    }

    // Assign permission to admin role
    const existingAdminPermission = await prisma.rolePermission.findFirst({
      where: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });

    if (!existingAdminPermission) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
      console.log('Assigned user_delete permission to admin role.');
    } else {
      console.log('Admin role already has user_delete permission.');
    }

    // Assign permission to manager role if it exists
    if (managerRole) {
      const existingManagerPermission = await prisma.rolePermission.findFirst({
        where: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      });

      if (!existingManagerPermission) {
        await prisma.rolePermission.create({
          data: {
            roleId: managerRole.id,
            permissionId: permission.id,
          },
        });
        console.log('Assigned user_delete permission to manager role.');
      } else {
        console.log('Manager role already has user_delete permission.');
      }
    }

    console.log('Successfully added user_delete permission to the system.');
  } catch (error) {
    console.error('Error adding user_delete permission:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addUserDeletePermission()
  .then(() => {
    console.log('Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
