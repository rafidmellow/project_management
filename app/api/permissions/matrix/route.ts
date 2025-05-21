import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

/**
 * API endpoint to get the complete permission matrix
 * This is used by edge functions to cache the permission matrix
 */
export async function GET(req: NextRequest) {
  try {
    // Check for middleware authorization header
    const authHeader = req.headers.get('authorization');
    const isMiddlewareRequest =
      authHeader &&
      authHeader.startsWith('Bearer ') &&
      authHeader.split(' ')[1] === process.env.NEXTAUTH_SECRET;

    // Check authentication for non-middleware requests
    if (!isMiddlewareRequest) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Build the permission matrix from the database
    const matrix: Record<string, string[]> = {};

    // Get all roles
    const roles = await prisma.role.findMany();

    // Get all role-permission relationships
    const rolePermissions = await prisma.rolePermission.findMany({
      include: {
        role: true,
        permission: true,
      },
    });

    // Initialize matrix with empty arrays for each role
    roles.forEach(role => {
      matrix[role.name] = [];
    });

    // Ensure we have standard roles in the matrix
    const standardRoles = ['admin', 'manager', 'user', 'guest'];
    standardRoles.forEach(role => {
      if (!matrix[role]) {
        matrix[role] = [];
      }
    });

    // Populate the matrix with permissions
    rolePermissions.forEach(rp => {
      if (matrix[rp.role.name]) {
        matrix[rp.role.name].push(rp.permission.name);
      }
    });

    // Return the matrix
    return NextResponse.json(matrix);
  } catch (error: any) {
    console.error('Error building permission matrix:', error);
    return NextResponse.json(
      { error: 'Failed to build permission matrix', details: error.message },
      { status: 500 }
    );
  }
}
