import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getLocationName } from '@/lib/geo-utils';
import {
  differenceInHours,
  isAfter,
  isSameDay,
  startOfDay,
  endOfDay,
  differenceInDays,
  setHours,
  setMinutes,
} from 'date-fns';
import { WORK_DAY, API_ERROR_CODES, ACTION_TYPES } from '@/lib/constants/attendance';
import { calculateTotalHours, getWorkdayEnd } from '@/lib/utils/date';
import { AttendanceCheckOutDTO, AttendanceResponse, Attendance } from '@/types/attendance';

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: API_ERROR_CODES.UNAUTHORIZED });
    }

    // Parse request body
    const body = await req.json();
    const { latitude, longitude, attendanceId, notes }: AttendanceCheckOutDTO = body;

    // Find the active attendance record
    const attendance = attendanceId
      ? await prisma.attendance.findUnique({ where: { id: attendanceId } })
      : await prisma.attendance.findFirst({
          where: {
            userId: session.user.id,
            checkOutTime: null,
          },
          orderBy: {
            checkInTime: 'desc',
          },
        });

    if (!attendance) {
      return NextResponse.json(
        { error: 'No active check-in found' },
        { status: API_ERROR_CODES.NOT_FOUND }
      );
    }

    // Verify the attendance record belongs to the user
    if (attendance.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: API_ERROR_CODES.FORBIDDEN });
    }

    // If already checked out
    if (attendance.checkOutTime) {
      return NextResponse.json(
        { error: 'Already checked out', attendance },
        { status: API_ERROR_CODES.ALREADY_CHECKED_OUT }
      );
    }

    // Calculate check-out time with improved logic
    const checkInTime = new Date(attendance.checkInTime);
    const now = new Date();

    // Check if check-in time is today
    const isSameDayCheckIn = isSameDay(checkInTime, now);

    // Check how many days have passed since check-in
    const daysSinceCheckIn = differenceInDays(now, checkInTime);

    // Determine appropriate check-out time with improved logic
    let checkOutTime = now;
    let isAutoCheckout = false;

    // Handle different scenarios based on when the check-in occurred
    if (!isSameDayCheckIn) {
      isAutoCheckout = true;

      // If checking out for a past date, use a more intelligent approach
      if (daysSinceCheckIn === 1) {
        // For check-ins from yesterday, use end of workday if during work hours,
        // or default hours from check-in time if outside work hours
        const workdayEnd = getWorkdayEnd(checkInTime);

        // If checked in during work hours, use workday end
        if (checkInTime <= workdayEnd) {
          checkOutTime = workdayEnd;
        } else {
          // If checked in after work hours, use default checkout duration
          const defaultCheckOut = new Date(checkInTime);
          defaultCheckOut.setHours(defaultCheckOut.getHours() + WORK_DAY.DEFAULT_CHECKOUT_HOURS);

          // But don't exceed the end of the check-in day
          const endOfCheckInDay = endOfDay(checkInTime);
          checkOutTime = isAfter(defaultCheckOut, endOfCheckInDay)
            ? endOfCheckInDay
            : defaultCheckOut;
        }
      } else if (daysSinceCheckIn > 1) {
        // For older check-ins (more than a day ago), always use end of workday
        // This prevents unrealistic work hours for forgotten check-outs
        checkOutTime = getWorkdayEnd(checkInTime);
      }
    }

    // Calculate total hours using our improved utility function
    const totalHours = calculateTotalHours(checkInTime, checkOutTime, {
      isAutoCheckout,
      applyWorkdayBounds: true,
      maxHoursPerDay: WORK_DAY.MAX_HOURS_PER_DAY,
    });

    // Get location name if coordinates are provided
    let locationName = null;
    if (latitude && longitude) {
      try {
        locationName = await getLocationName(latitude, longitude);
      } catch (error) {
        console.error('Error getting location name:', error);
      }
    }

    // Update attendance record with check-out information
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime,
        checkOutLatitude: latitude || null,
        checkOutLongitude: longitude || null,
        checkOutLocationName: locationName,
        checkOutIpAddress: req.headers.get('x-forwarded-for') || null,
        checkOutDeviceInfo: req.headers.get('user-agent') || null,
        totalHours,
        notes: notes || attendance.notes, // Update notes if provided
        autoCheckout: isAutoCheckout, // Flag if this was an automatic checkout
      },
    });

    // Log activity with more detailed description
    await prisma.activity.create({
      data: {
        action: isAutoCheckout ? ACTION_TYPES.AUTO_CHECKOUT : ACTION_TYPES.CHECK_OUT,
        entityType: 'attendance',
        entityId: attendance.id,
        description: isAutoCheckout
          ? `System applied automatic checkout (${totalHours} hours) for check-in from ${daysSinceCheckIn} day(s) ago`
          : `User checked out after ${totalHours} hours`,
        userId: session.user.id,
      },
    });

    // Return response with proper type
    const response: AttendanceResponse = {
      attendance: updatedAttendance,
    };

    return NextResponse.json({
      ...response,
      message: 'Check-out successful',
      wasAutoCheckout: isAutoCheckout,
      checkOutTime: checkOutTime.toISOString(),
      totalHours,
    });
  } catch (error) {
    console.error('Check-out error:', error);
    return NextResponse.json(
      { error: 'Failed to check out' },
      { status: API_ERROR_CODES.SERVER_ERROR }
    );
  }
}
