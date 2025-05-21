import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { PermissionService } from '@/lib/permissions/unified-permission-service';

// GET /api/users/permissions?userId={userId} - Get permissions for a user
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get userId from query params
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || session.user.id;

    // If requesting permissions for another user, check if the current user has permission
    if (userId !== session.user.id) {
      const hasPermission = await PermissionService.hasPermissionById(
        session.user.id,
        'user_management'
      );
      if (!hasPermission) {
        return NextResponse.json(
          { error: "Forbidden: Insufficient permissions to view other users' permissions" },
          { status: 403 }
        );
      }
    }

    // Get permissions directly for the user ID
    const permissions = await PermissionService.getPermissionsForUser(userId);

    // Return the permissions
    return NextResponse.json({ permissions });
  } catch (error: any) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user permissions', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/users/permissions - Grant a permission to a user
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage permissions
    const hasPermission = await PermissionService.hasPermissionById(
      session.user.id,
      'user_management'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { userId, permissionName } = body;

    // Validate request data
    if (!userId || !permissionName) {
      return NextResponse.json(
        { error: 'User ID and permission name are required' },
        { status: 400 }
      );
    }

    // In the simplified system, we can't grant individual permissions
    // We need to update the user's role to one that has the permission

    // Get all roles that have this permission
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Filter roles that have the requested permission
    const rolesWithPermission = roles
      .filter(role => role.permissions.some(rp => rp.permission.name === permissionName))
      .map(role => role.name);

    if (rolesWithPermission.length === 0) {
      return NextResponse.json({ error: 'No role has this permission' }, { status: 400 });
    }

    // Get the user's current role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If the user already has this permission, we don't need to do anything
    const userHasPermission = await PermissionService.hasPermissionById(userId, permissionName);
    if (userHasPermission) {
      return NextResponse.json({
        message: `User already has permission '${permissionName}'`,
      });
    }

    // Otherwise, update the user's role to the first role that has this permission
    const newRole = rolesWithPermission[0];
    const success = await prisma.user
      .update({
        where: { id: userId },
        data: { role: newRole },
      })
      .then(() => true)
      .catch(() => false);

    // Return success
    return NextResponse.json({
      message: `Permission '${permissionName}' granted to user successfully`,
    });
  } catch (error: any) {
    console.error('Error granting permission to user:', error);
    return NextResponse.json(
      { error: 'Failed to grant permission', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/users/permissions - Remove a permission from a user
export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage permissions
    const hasPermission = await PermissionService.hasPermissionById(
      session.user.id,
      'user_management'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // Get query params
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const permissionName = url.searchParams.get('permission');

    // Validate request data
    if (!userId || !permissionName) {
      return NextResponse.json(
        { error: 'User ID and permission name are required' },
        { status: 400 }
      );
    }

    // In the simplified system, we can't remove individual permissions
    // We need to update the user's role to one that doesn't have the permission

    // Get the user's current role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If the user doesn't have this permission, we don't need to do anything
    const userHasPermission = await PermissionService.hasPermissionById(userId, permissionName);
    if (!userHasPermission) {
      return NextResponse.json({
        message: `User doesn't have permission '${permissionName}'`,
      });
    }

    // Find a role that doesn't have this permission
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Filter roles that don't have the requested permission
    const rolesWithoutPermission = roles
      .filter(role => !role.permissions.some(rp => rp.permission.name === permissionName))
      .map(role => role.name);

    // If no roles without this permission exist, we can't remove it
    if (rolesWithoutPermission.length === 0) {
      return NextResponse.json({
        error: `Cannot remove permission '${permissionName}' as all roles have it`,
        status: 400,
      });
    }

    // Use the first role that doesn't have this permission
    const newRole = rolesWithoutPermission[0];
    const success = await prisma.user
      .update({
        where: { id: userId },
        data: { role: newRole },
      })
      .then(() => true)
      .catch(() => false);

    // Return success
    return NextResponse.json({
      message: `Permission '${permissionName}' removed from user successfully`,
    });
  } catch (error: any) {
    console.error('Error removing permission from user:', error);
    return NextResponse.json(
      { error: 'Failed to remove permission', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/users/permissions - Deny a permission to a user
export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage permissions
    const hasPermission = await PermissionService.hasPermissionById(
      session.user.id,
      'user_management'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { userId, permissionName } = body;

    // Validate request data
    if (!userId || !permissionName) {
      return NextResponse.json(
        { error: 'User ID and permission name are required' },
        { status: 400 }
      );
    }

    // In the simplified system, denying a permission is the same as removing it
    // We need to update the user's role to one that doesn't have the permission

    // Get the user's current role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If the user doesn't have this permission, we don't need to do anything
    const userHasPermission = await PermissionService.hasPermissionById(userId, permissionName);
    if (!userHasPermission) {
      return NextResponse.json({
        message: `User doesn't have permission '${permissionName}'`,
      });
    }

    // Find a role that doesn't have this permission
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Filter roles that don't have the requested permission
    const rolesWithoutPermission = roles
      .filter(role => !role.permissions.some(rp => rp.permission.name === permissionName))
      .map(role => role.name);

    // If no roles without this permission exist, we can't deny it
    if (rolesWithoutPermission.length === 0) {
      return NextResponse.json({
        error: `Cannot deny permission '${permissionName}' as all roles have it`,
        status: 400,
      });
    }

    // Use the first role that doesn't have this permission
    const newRole = rolesWithoutPermission[0];
    const success = await prisma.user
      .update({
        where: { id: userId },
        data: { role: newRole },
      })
      .then(() => true)
      .catch(() => false);

    // Return success
    return NextResponse.json({
      message: `Permission '${permissionName}' denied for user successfully`,
    });
  } catch (error: any) {
    console.error('Error denying permission to user:', error);
    return NextResponse.json(
      { error: 'Failed to deny permission', details: error.message },
      { status: 500 }
    );
  }
}
