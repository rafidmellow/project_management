import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  isSameDay,
  addDays,
} from 'date-fns';
import {
  AttendanceFilterOptions,
  AttendanceHistoryResponse,
  AttendanceGroup,
  AttendanceWithRelations,
} from '@/types/attendance';

// Constants - keep consistent with other attendance endpoints
const MAX_WORKING_HOURS_PER_DAY = 12;

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const filterOptions: AttendanceFilterOptions = {
      period: url.searchParams.get('period') as 'day' | 'week' | 'month' | 'custom' | undefined,
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '30'),
      page: parseInt(url.searchParams.get('page') || '1'),
      groupBy: url.searchParams.get('groupBy') as 'day' | 'week' | 'month' | undefined,
    };

    const { period, startDate, endDate, limit = 30, page = 1, groupBy } = filterOptions;
    const skip = (page - 1) * limit;

    // Build the where clause
    const where: any = {
      userId: session.user.id,
    };

    // Handle period parameter
    if (period) {
      const now = new Date();
      let periodStartDate, periodEndDate;

      if (period === 'week') {
        periodStartDate = startOfWeek(now, { weekStartsOn: 1 }); // Start week on Monday for consistency
        periodEndDate = endOfWeek(now, { weekStartsOn: 1 });
      } else if (period === 'month') {
        periodStartDate = startOfMonth(now);
        periodEndDate = endOfMonth(now);
      } else if (period === 'day') {
        periodStartDate = new Date(now.setHours(0, 0, 0, 0));
        periodEndDate = new Date(now.setHours(23, 59, 59, 999));
      }

      if (periodStartDate && periodEndDate) {
        where.checkInTime = {
          gte: periodStartDate,
          lte: periodEndDate,
        };
      }
    } else {
      // Add date filters if provided and no period specified
      if (startDate || endDate) {
        where.checkInTime = {};

        if (startDate) {
          where.checkInTime.gte = new Date(startDate);
        }

        if (endDate) {
          // Include the full end date by setting time to end of day
          const fullEndDate = new Date(endDate);
          fullEndDate.setHours(23, 59, 59, 999);
          where.checkInTime.lte = fullEndDate;
        }
      }
    }

    // Get total count for pagination first (for efficiency)
    const totalCount = await prisma.attendance.count({ where });

    // Get attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where,
      orderBy: {
        checkInTime: 'desc',
      },
      // Apply pagination efficiently depending on grouping
      ...(groupBy ? {} : { skip, take: limit }),
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

    // Process records for individual view (apply pagination when not grouping)
    const paginatedRecords = groupBy
      ? attendanceRecords.slice(skip, Math.min(skip + limit, attendanceRecords.length))
      : attendanceRecords;

    // Group records if requested
    let groupedRecords: AttendanceGroup[] = [];
    // Create a map to group records (declared outside the if block so it can be referenced in the response)
    const groupMap = new Map();

    if (groupBy) {
      // Process each record for grouping
      attendanceRecords.forEach(record => {
        try {
          // Skip records with invalid dates
          const date = new Date(record.checkInTime);
          if (isNaN(date.getTime())) {
            return;
          }

          // Generate appropriate group key based on groupBy parameter
          let groupKey;
          let displayLabel;

          if (groupBy === 'day') {
            // Format: 2023-04-22
            groupKey = format(date, 'yyyy-MM-dd');
            displayLabel = format(date, 'EEEE, MMMM d, yyyy');
          } else if (groupBy === 'week') {
            // Get the start and end of the week (starting Monday)
            const weekStart = startOfWeek(date, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
            // Format: 2023-04-17 to 2023-04-23
            groupKey = format(weekStart, 'yyyy-MM-dd');
            displayLabel = `Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
          } else if (groupBy === 'month') {
            // Format: 2023-04 (Year-Month)
            groupKey = format(date, 'yyyy-MM');
            displayLabel = format(date, 'MMMM yyyy');
          } else {
            // Default fallback
            groupKey = 'unknown';
            displayLabel = 'Unknown Period';
          }

          // Create group if it doesn't exist yet
          if (!groupMap.has(groupKey)) {
            groupMap.set(groupKey, {
              period: groupKey,
              displayLabel,
              records: [],
              totalHours: 0,
              checkInCount: 0,
              uniqueDates: new Set(),
            });
          }

          // Add record to its group
          const group = groupMap.get(groupKey);
          group.records.push(record);

          // Track unique dates for accurate daily averaging
          group.uniqueDates.add(format(date, 'yyyy-MM-dd'));

          // Add hours with the consistent MAX_WORKING_HOURS_PER_DAY limit per record
          if (record.totalHours) {
            group.totalHours += Math.min(record.totalHours, MAX_WORKING_HOURS_PER_DAY);
          }

          group.checkInCount += 1;
        } catch (error) {
          // Skip this record on error
        }
      });

      // Convert the map to an array with calculated stats
      const tempGroupedRecords = Array.from(groupMap.values()).map(group => {
        const uniqueDaysCount = group.uniqueDates.size;

        // Calculate average hours per day based on unique days with activity
        const averageHoursPerDay = uniqueDaysCount > 0 ? group.totalHours / uniqueDaysCount : 0;

        // Clean up the group object before returning
        const { uniqueDates, ...cleanGroup } = group;

        return {
          ...cleanGroup,
          uniqueDaysCount,
          totalHours: parseFloat(group.totalHours.toFixed(2)),
          averageHoursPerDay: parseFloat(averageHoursPerDay.toFixed(2)),
        };
      });

      // Sort by date (newest first)
      tempGroupedRecords.sort((a, b) => {
        // Compare the period strings (which are in sortable format)
        return b.period.localeCompare(a.period);
      });

      // Apply pagination to the grouped records
      groupedRecords = tempGroupedRecords.slice(skip, skip + limit);
    }

    // Calculate summary statistics
    const summary = {
      totalHours: attendanceRecords.reduce((sum, record) => sum + (record.totalHours || 0), 0),
      averageHoursPerDay: 0,
      uniqueDaysCount: new Set(
        attendanceRecords.map(record => format(new Date(record.checkInTime), 'yyyy-MM-dd'))
      ).size,
    };

    // Calculate average if we have unique days
    if (summary.uniqueDaysCount > 0) {
      summary.averageHoursPerDay = summary.totalHours / summary.uniqueDaysCount;
    }

    // Create response
    const response = {
      records: !groupBy ? paginatedRecords : [], // Only include if not grouping
      groupedRecords: groupBy ? groupedRecords : undefined,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary,
    };

    // Return the response with both individual and grouped records
    return NextResponse.json({
      ...response,
      totalGroups: groupBy ? groupMap.size : null,
      groupBy: groupBy || null,
      period,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    return NextResponse.json({ error: 'Failed to retrieve attendance history' }, { status: 500 });
  }
}
