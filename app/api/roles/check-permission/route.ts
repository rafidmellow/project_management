import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PermissionService } from '@/lib/permissions/unified-permission-service';

// GET /api/roles/check-permission?role={role}&permission={permission} - Check if a role has a permission
// NOTE: This is a legacy endpoint that uses role-based permission checks.
// For new code, prefer using /api/users/check-permission with userId parameter instead.
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get role and permission from query params
    const url = new URL(req.url);
    const role = url.searchParams.get('role');
    const permission = url.searchParams.get('permission');

    // Validate query params
    if (!role || !permission) {
      return NextResponse.json({ error: 'Role and permission are required' }, { status: 400 });
    }

    // Check if the role has the permission
    const hasPermission = await PermissionService.hasPermission(role, permission);

    // Return the result
    return NextResponse.json({ hasPermission });
  } catch (error: any) {
    console.error('Error checking permission:', error);
    return NextResponse.json(
      { error: 'Failed to check permission', details: error.message },
      { status: 500 }
    );
  }
}
