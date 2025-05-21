import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PermissionService } from '@/lib/permissions/unified-permission-service';
import prisma from '@/lib/prisma';

// POST /api/roles/update-permissions - Update role permissions
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
    const { roleId, permissions } = body;

    // Validate request data
    if (!roleId || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Role ID and permissions array are required' },
        { status: 400 }
      );
    }

    // Get the role
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Don't allow modifying admin role permissions
    if (role.name === 'admin') {
      return NextResponse.json({ error: 'Cannot modify admin role permissions' }, { status: 400 });
    }

    // Delete existing role permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Create new role permissions
    const permissionRecords = await prisma.permission.findMany({
      where: {
        name: {
          in: permissions,
        },
      },
    });

    // Check if all permissions exist
    if (permissionRecords.length !== permissions.length) {
      const foundPermissions = permissionRecords.map(p => p.name);
      const missingPermissions = permissions.filter(p => !foundPermissions.includes(p));

      return NextResponse.json(
        {
          error: 'Some permissions do not exist',
          missingPermissions,
        },
        { status: 400 }
      );
    }

    // Create role permissions
    const rolePermissions = await Promise.all(
      permissionRecords.map(permission =>
        prisma.rolePermission.create({
          data: {
            roleId,
            permissionId: permission.id,
          },
        })
      )
    );

    // Clear the permission cache
    PermissionService.clearCache();

    // Return success
    return NextResponse.json({
      message: 'Role permissions updated successfully',
      roleId,
      permissionsCount: rolePermissions.length,
    });
  } catch (error: any) {
    console.error('Error updating role permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update role permissions', details: error.message },
      { status: 500 }
    );
  }
}
