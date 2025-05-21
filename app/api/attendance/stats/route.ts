import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { startOfWeek, endOfWeek, format, differenceInBusinessDays, isWeekend } from 'date-fns';

// Constants - keep consistent with other attendance endpoints
const MAX_WORKING_HOURS_PER_DAY = 12;
const WORK_START_HOUR = 9; // 9:00 AM
const LATE_THRESHOLD_MINUTES = 15; // 15 minutes grace period

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const period = url.searchParams.get('period') || 'month'; // day, week, month, year

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case 'week':
        // Start of current week (Monday for consistency)
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        break;
    }

    // Get attendance records for the period
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        userId: session.user.id,
        checkInTime: {
          gte: startDate,
        },
      },
      orderBy: {
        checkInTime: 'desc',
      },
    });

    // Track unique days and daily hours
    const dailyHours = new Map();
    const daysOnTime = new Set();
    const daysLate = new Set();
    const daysPresent = new Set();

    // Process all attendance records
    attendanceRecords.forEach(record => {
      // Extract date key for grouping by day
      const recordDate = new Date(record.checkInTime);
      const dateKey = format(recordDate, 'yyyy-MM-dd');

      // Track this day as having attendance
      daysPresent.add(dateKey);

      // Calculate on-time status with grace period
      const checkInHour = recordDate.getHours();
      const checkInMinutes = recordDate.getMinutes();

      // Consider on time if before start hour or within grace period
      const isOnTime =
        checkInHour < WORK_START_HOUR ||
        (checkInHour === WORK_START_HOUR && checkInMinutes <= LATE_THRESHOLD_MINUTES);

      // Track on-time/late days (only count each day once for the earliest check-in)
      if (!daysOnTime.has(dateKey) && !daysLate.has(dateKey)) {
        if (isOnTime) {
          daysOnTime.add(dateKey);
        } else {
          daysLate.add(dateKey);
        }
      }

      // Track and cap hours per day
      if (record.totalHours) {
        // Cap hours for this record
        const cappedHours = Math.min(record.totalHours, MAX_WORKING_HOURS_PER_DAY);

        // Add to daily total
        if (!dailyHours.has(dateKey)) {
          dailyHours.set(dateKey, 0);
        }

        dailyHours.set(dateKey, dailyHours.get(dateKey) + cappedHours);
      }
    });

    // Apply daily hour caps and calculate total hours
    let totalHours = 0;
    dailyHours.forEach((hours, dateKey) => {
      totalHours += Math.min(hours, MAX_WORKING_HOURS_PER_DAY);
    });

    // Calculate working days in the period (excluding weekends)
    const endDate = new Date();
    const totalWorkingDays = differenceInBusinessDays(endDate, startDate) + 1;

    // Total days with attendance
    const completedDays = daysPresent.size;

    // Calculate average hours per working day with attendance
    const averageHours = completedDays > 0 ? totalHours / completedDays : 0;

    // On-time percentage based on days with check-ins
    const totalDaysWithAttendance = daysOnTime.size + daysLate.size;
    const onTimePercentage =
      totalDaysWithAttendance > 0 ? (daysOnTime.size / totalDaysWithAttendance) * 100 : 0;

    // Calculate attendance rate (attendance days / working days)
    const attendanceRate = totalWorkingDays > 0 ? (completedDays / totalWorkingDays) * 100 : 0;

    return NextResponse.json({
      stats: {
        period,
        totalHours: parseFloat(totalHours.toFixed(2)),
        averageHours: parseFloat(averageHours.toFixed(2)),
        attendanceDays: completedDays,
        totalWorkingDays,
        daysOnTime: daysOnTime.size,
        daysLate: daysLate.size,
        attendanceRate: parseFloat(attendanceRate.toFixed(2)),
        onTimeRate: parseFloat(onTimePercentage.toFixed(2)),
        // Include date range for reference
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      },
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve attendance statistics' },
      { status: 500 }
    );
  }
}
