import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PermissionService } from '@/lib/permissions/unified-permission-service';
import prisma from '@/lib/prisma';

// POST /api/roles/create - Create a new role
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage roles
    const hasPermission = await PermissionService.hasPermissionById(
      session.user.id,
      'manage_roles'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { name, description, color, permissions } = body;

    // Validate request data
    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    // Create the role
    try {
      const role = await prisma.role.create({
        data: {
          name,
          description,
          color,
        },
      });

      // If permissions are provided, assign them to the role
      if (permissions && Array.isArray(permissions) && permissions.length > 0) {
        // Get the permission records
        const permissionRecords = await prisma.permission.findMany({
          where: {
            name: {
              in: permissions,
            },
          },
        });

        // Create role permissions
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
      PermissionService.clearCache();

      // Return success
      return NextResponse.json({
        message: 'Role created successfully',
        role,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Role with this name already exists' }, { status: 400 });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role', details: error.message },
      { status: 500 }
    );
  }
}
