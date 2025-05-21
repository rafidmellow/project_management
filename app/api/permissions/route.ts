import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PermissionService } from '@/lib/permissions/unified-permission-service';
import prisma from '@/lib/prisma';

// GET /api/permissions - Get all permissions
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all permissions
    const permissions = await PermissionService.getAllPermissions();

    // Return the permissions
    return NextResponse.json(permissions);
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/permissions - Create a new permission
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, allow any authenticated admin to access this endpoint
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { name, description, category } = body;

    // Validate permission data
    if (!name) {
      return NextResponse.json({ error: 'Permission name is required' }, { status: 400 });
    }

    // Create the permission in the database
    try {
      await prisma.permission.create({
        data: {
          name,
          description,
          category,
        },
      });

      // Clear the permission cache
      PermissionService.clearCache();

      return NextResponse.json({
        message: 'Permission created successfully',
        permission: { name, description, category },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Permission with this name already exists' },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { error: 'Failed to create permission', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/permissions?name={permissionName} - Delete a permission
export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, allow any authenticated admin to access this endpoint
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get permission name from query params
    const url = new URL(req.url);
    const name = url.searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Permission name is required' }, { status: 400 });
    }

    // Delete the permission from the database
    try {
      // First check if the permission exists
      const permission = await prisma.permission.findUnique({
        where: { name },
        include: { roles: true },
      });

      if (!permission) {
        return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
      }

      // Check if the permission is assigned to any roles
      if (permission.roles.length > 0) {
        return NextResponse.json(
          {
            error: 'Cannot delete permission that is assigned to roles',
            message: 'Remove this permission from all roles first',
          },
          { status: 400 }
        );
      }

      // Delete the permission
      await prisma.permission.delete({
        where: { name },
      });

      // Clear the permission cache
      PermissionService.clearCache();

      return NextResponse.json({
        message: 'Permission deleted successfully',
      });
    } catch (error: any) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting permission:', error);
    return NextResponse.json(
      { error: 'Failed to delete permission', details: error.message },
      { status: 500 }
    );
  }
}
