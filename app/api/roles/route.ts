import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PermissionService } from '@/lib/permissions/unified-permission-service';

// GET /api/roles - Get all roles
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all roles
    const roles = await PermissionService.getAllRoles();

    // Return the roles
    return NextResponse.json(roles);
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/roles - Create a new role
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
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { name, description } = body;

    // Validate role data
    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    // Create the role using the PermissionService
    try {
      const role = await PermissionService.createRole(name, description || `${name} role`);
      return NextResponse.json({
        message: 'Role created successfully',
        role,
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to create role', details: error.message },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/roles?name={roleName} - Delete a role
export async function DELETE(req: NextRequest) {
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
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get role name from query params
    const url = new URL(req.url);
    const name = url.searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    // Delete the role using the PermissionService
    try {
      // Don't allow deleting built-in roles
      if (['admin', 'manager', 'user', 'guest'].includes(name)) {
        return NextResponse.json({ error: 'Cannot delete built-in roles' }, { status: 400 });
      }

      const success = await PermissionService.deleteRole(name);

      if (!success) {
        return NextResponse.json({ error: 'Failed to delete role' }, { status: 400 });
      }

      return NextResponse.json({
        message: 'Role deleted successfully',
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to delete role', details: error.message },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role', details: error.message },
      { status: 500 }
    );
  }
}
