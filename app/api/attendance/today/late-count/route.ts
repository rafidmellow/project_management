import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getDayBoundaries, getLateThreshold } from '@/lib/utils/date';
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

    // Get today's date boundaries for the query
    const today = new Date();
    const { start, end } = getDayBoundaries(today);
    const lateThreshold = getLateThreshold(today);

    // Count unique users who checked in late today
    const count = await prisma.attendance.count({
      where: {
        checkInTime: {
          gte: lateThreshold,
          lte: end,
        },
      },
      // Count each user only once
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching late count:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch late count' }), {
      status: 500,
    });
  }
}
