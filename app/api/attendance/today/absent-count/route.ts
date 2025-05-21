import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getDayBoundaries, isWeekendDay } from '@/lib/utils/date';
import { PermissionService } from '@/lib/permissions/unified-permission-service';

export async function GET() {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has attendance management permission
    const hasAttendanceManagementPermission = await PermissionService.hasPermissionById(
      session.user.id,
      'attendance_management'
    );

    if (!hasAttendanceManagementPermission) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to access attendance statistics' },
        { status: 403 }
      );
    }

    // Skip weekend days as they're not workdays by default
    const today = new Date();
    if (isWeekendDay(today)) {
      return NextResponse.json({ count: 0 });
    }

    // Get today's date boundaries for the query
    const { start, end } = getDayBoundaries(today);

    // First, get total active employees
    // Get all roles that don't have attendance_management permission
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Filter roles that don't have attendance management permission
    const nonManagerRoles = roles
      .filter(role => !role.permissions.some(rp => rp.permission.name === 'attendance_management'))
      .map(role => role.name);

    // Count active users with non-manager roles
    const totalEmployees = await prisma.user.count({
      where: {
        active: true,
        role: {
          in: nonManagerRoles, // Only include users with non-manager roles
        },
      },
    });

    // Then, count users who have checked in today
    const attendanceCount = await prisma.attendance.count({
      where: {
        checkInTime: {
          gte: start,
          lte: end,
        },
      },
      // Count each user only once
    });

    // Absent = Total employees - Those who checked in
    const absentCount = Math.max(0, totalEmployees - attendanceCount);

    return NextResponse.json({ count: absentCount });
  } catch (error) {
    console.error('Error fetching absent count:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch absent count' }), {
      status: 500,
    });
  }
}
