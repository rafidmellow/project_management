import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { PermissionService } from '@/lib/permissions/unified-permission-service';

// GET /api/users/roles?userId={userId} - Get roles for a user
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

    // If requesting roles for another user, check if the current user has permission
    if (userId !== session.user.id) {
      const hasPermission = await PermissionService.hasPermissionById(
        session.user.id,
        'user_management'
      );
      if (!hasPermission) {
        return NextResponse.json(
          { error: "Forbidden: Insufficient permissions to view other users' roles" },
          { status: 403 }
        );
      }
    }

    // Get the user to check their role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Return the user's role as an array for backward compatibility
    const roles = user ? [user.role] : [];

    // Return the roles
    return NextResponse.json({ roles });
  } catch (error: any) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user roles', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/users/roles - Assign a role to a user
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
      'user_management'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { userId, roleName } = body;

    // Validate request data
    if (!userId || !roleName) {
      return NextResponse.json({ error: 'User ID and role name are required' }, { status: 400 });
    }

    // Update the user's role
    const success = await prisma.user
      .update({
        where: { id: userId },
        data: { role: roleName },
      })
      .then(() => true)
      .catch(() => false);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    // Return success
    return NextResponse.json({
      message: `Role '${roleName}' assigned to user successfully`,
    });
  } catch (error: any) {
    console.error('Error assigning role to user:', error);
    return NextResponse.json(
      { error: 'Failed to assign role', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/users/roles - Remove a role from a user
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
      'user_management'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // Get query params
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const roleName = url.searchParams.get('role');

    // Validate request data
    if (!userId || !roleName) {
      return NextResponse.json({ error: 'User ID and role name are required' }, { status: 400 });
    }

    // We can't remove a role, only update it to a different role
    // For backward compatibility, we'll set the role to 'user' when removing a role
    const success = await prisma.user
      .update({
        where: { id: userId },
        data: { role: 'user' },
      })
      .then(() => true)
      .catch(() => false);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    // Return success
    return NextResponse.json({
      message: `Role '${roleName}' removed from user successfully`,
    });
  } catch (error: any) {
    console.error('Error removing role from user:', error);
    return NextResponse.json(
      { error: 'Failed to remove role', details: error.message },
      { status: 500 }
    );
  }
}
