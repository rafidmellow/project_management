import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PermissionService } from '@/lib/permissions/unified-permission-service';

// GET /api/roles/permissions - Get all role permissions
export async function GET(req: NextRequest) {
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

    // Get all roles
    const roles = await PermissionService.getAllRoles();

    // Create a permission matrix
    const permissionMatrix: Record<string, string[]> = {};

    // For each role, get its permissions
    for (const role of roles) {
      const permissions = await PermissionService.getPermissionsForRole(role.id);
      permissionMatrix[role.id] = permissions;
    }

    // Return the permission matrix
    return NextResponse.json(permissionMatrix);
  } catch (error: any) {
    console.error('Error fetching role permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role permissions', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/roles/permissions - Update role permissions
export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage roles
    const hasPermission = await PermissionService.hasPermission(session.user.role, 'manage_roles');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { permissions } = body;

    // Validate permissions
    if (!permissions || typeof permissions !== 'object') {
      return NextResponse.json({ error: 'Invalid permissions data' }, { status: 400 });
    }

    // Update the permissions in the database
    const success = await PermissionService.updateAllRolePermissions(permissions);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update role permissions' }, { status: 500 });
    }

    // Return success
    return NextResponse.json({
      message: 'Role permissions updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating role permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update role permissions', details: error.message },
      { status: 500 }
    );
  }
}
