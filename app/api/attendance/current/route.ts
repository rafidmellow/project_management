import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { calculateTotalHours } from '@/lib/utils/date';
import { WORK_DAY } from '@/lib/constants/attendance';

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current date (start of day and end of day)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Find all attendance records for today
    const todayAttendances = await prisma.attendance.findMany({
      where: {
        userId: session.user.id,
        checkInTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        checkInTime: 'desc',
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });

    // If no attendance records found for today
    if (todayAttendances.length === 0) {
      // Get the most recent attendance record (even if not today)
      const lastAttendance = await prisma.attendance.findFirst({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          checkInTime: 'desc',
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
        },
      });

      return NextResponse.json({
        message: 'No attendance record found for today',
        attendance: lastAttendance,
        todayAttendances: [],
        currentAttendance: null,
        totalHoursToday: 0,
        hasActiveSession: false,
      });
    }

    // Get the most recent attendance record (current attendance)
    const currentAttendance = todayAttendances[0];

    // Calculate total hours for today
    let totalHoursToday = 0;
    let hasActiveSession = false;

    // Process each attendance record
    todayAttendances.forEach(record => {
      if (record.checkOutTime) {
        // For completed sessions, use the stored totalHours
        totalHoursToday += record.totalHours || 0;
      } else {
        // For active session, calculate elapsed time
        hasActiveSession = true;
        const elapsedHours = calculateTotalHours(new Date(record.checkInTime), now, {
          maxHoursPerDay: WORK_DAY.MAX_HOURS_PER_DAY,
        });
        totalHoursToday += elapsedHours;
      }
    });

    // Round to 2 decimal places
    totalHoursToday = Math.round(totalHoursToday * 100) / 100;

    return NextResponse.json({
      message: 'Attendance records retrieved',
      attendance: currentAttendance, // For backward compatibility
      currentAttendance,
      todayAttendances,
      totalHoursToday,
      hasActiveSession,
    });
  } catch (error) {
    console.error('Get current attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve attendance information' },
      { status: 500 }
    );
  }
}
