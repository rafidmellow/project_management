import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';
import { format } from 'date-fns';
import { PermissionService } from '@/lib/permissions/unified-permission-service';

// Constants - keep consistent with other attendance endpoints
const MAX_WORKING_HOURS_PER_DAY = 12;

// GET /api/users/[userId]/attendance - Get attendance records for a specific user
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract userId from params (await required in App Router)
    const { userId } = await params;

    // Check if user has permission to view this user's attendance
    // Users can view their own attendance, users with view_team_attendance permission can view any user's attendance
    const isOwnProfile = session.user.id === userId;
    const hasViewTeamAttendancePermission = await PermissionService.hasPermissionById(
      session.user.id,
      'view_team_attendance'
    );

    if (!isOwnProfile && !hasViewTeamAttendancePermission) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view this user's attendance" },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '5');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build where clause with proper date range handling
    const where: any = { userId };

    // Handle date filtering properly
    if (startDate || endDate) {
      where.checkInTime = {};

      if (startDate) {
        // Starting from beginning of the start date
        const parsedStartDate = new Date(startDate);
        parsedStartDate.setHours(0, 0, 0, 0);
        where.checkInTime.gte = parsedStartDate;
      }

      if (endDate) {
        // Include the full end date by setting time to end of day
        const parsedEndDate = new Date(endDate);
        parsedEndDate.setHours(23, 59, 59, 999);
        where.checkInTime.lte = parsedEndDate;
      }
    }

    // Get attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where,
      orderBy: {
        checkInTime: 'desc',
      },
      skip,
      take: limit,
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });

    // Get total count for pagination
    const totalCount = await prisma.attendance.count({ where });

    // Calculate summary statistics with proper hour limits
    const allRecords = await prisma.attendance.findMany({
      where,
      select: {
        id: true,
        totalHours: true,
        checkInTime: true,
        checkOutTime: true,
        autoCheckout: true,
      },
    });

    // Track unique days and cap hours per day
    const dailyHours = new Map();

    // Process records to calculate accurate statistics
    allRecords.forEach(record => {
      if (record.totalHours) {
        // Cap hours per record to consistent maximum
        const cappedHours = Math.min(record.totalHours, MAX_WORKING_HOURS_PER_DAY); // Get the date as string for grouping by day
        const dateKey = format(new Date(record.checkInTime!), 'yyyy-MM-dd');

        // Update daily totals
        if (!dailyHours.has(dateKey)) {
          dailyHours.set(dateKey, 0);
        }

        dailyHours.set(dateKey, dailyHours.get(dateKey) + cappedHours);
      }
    });

    // Calculate total hours with daily caps
    const totalHours = Array.from(dailyHours.values()).reduce((sum, dayHours) => {
      // Cap total hours per day
      return sum + Math.min(dayHours, MAX_WORKING_HOURS_PER_DAY);
    }, 0);

    // Find first and last records for the report
    let firstCheckIn = null;
    let lastCheckIn = null;
    let lastCheckOut = null;

    if (allRecords.length > 0) {
      // Sort records by check-in date (earliest first) to find first check-in
      const sortedByEarliest = [...allRecords].sort(
        (a, b) => new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime()
      );
      firstCheckIn = sortedByEarliest[0].checkInTime;

      // Sort records by check-in date (latest first) to find most recent check-in
      const sortedByLatest = [...allRecords].sort(
        (a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
      );
      lastCheckIn = sortedByLatest[0].checkInTime; // Find the most recent checkout
      const checkoutsOnly = allRecords.filter(r => r.checkOutTime !== null);
      if (checkoutsOnly.length > 0) {
        lastCheckOut = checkoutsOnly.sort(
          (a, b) => new Date(b.checkOutTime!).getTime() - new Date(a.checkOutTime!).getTime()
        )[0].checkOutTime;
      }
    }

    // Compile the summary with precise statistics
    const summary = {
      totalRecords: totalCount,
      totalHours: parseFloat(totalHours.toFixed(2)),
      averageHoursPerDay: parseFloat(
        (dailyHours.size > 0 ? totalHours / dailyHours.size : 0).toFixed(2)
      ),
      uniqueDays: dailyHours.size,
      firstCheckIn,
      lastCheckIn,
      lastCheckOut,
      autoCheckoutCount: allRecords.filter(r => r.autoCheckout).length,
    };

    // Return compiled data
    return NextResponse.json({
      attendanceRecords,
      summary,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching user attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user attendance', details: error.message },
      { status: 500 }
    );
  }
}
