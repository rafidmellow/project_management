import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';
import { ACTION_TYPES } from '@/lib/constants/activity';
import { WORK_DAY } from '@/lib/constants/attendance';
import { API_ERROR_CODES } from '@/lib/constants/api';
import { getLocationName } from '@/lib/utils/geo-utils';
import { calculateTotalHours } from '@/lib/utils/date';

/**
 * POST /api/attendance/auto-checkout
 * Performs auto-checkout for users who have enabled this feature
 * This endpoint can be called by:
 * 1. A scheduled task (e.g., cron job)
 * 2. Client-side code that checks if auto-checkout should be performed
 */
export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: API_ERROR_CODES.UNAUTHORIZED });
    }

    // Parse request body (optional parameters)
    const body = await req.json();
    const { forceCheckout = false } = body;

    // Get user's attendance settings
    const settings = await prisma.attendanceSettings.findUnique({
      where: { userId: session.user.id },
    });

    // If auto-checkout is not enabled and we're not forcing a checkout, return early
    if (!settings?.autoCheckoutEnabled && !forceCheckout) {
      return NextResponse.json({
        message: 'Auto-checkout is not enabled for this user',
        checked_out: false,
      });
    }

    // Find the active attendance record
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        checkOutTime: null,
      },
      orderBy: {
        checkInTime: 'desc',
      },
    });

    // If no active attendance record, return early
    if (!attendance) {
      return NextResponse.json({
        message: 'No active check-in found',
        checked_out: false,
      });
    }

    // Get the auto-checkout time
    const now = new Date();
    let checkOutTime = now;

    // If we have a specific auto-checkout time and we're not forcing checkout,
    // check if it's time to check out
    if (settings?.autoCheckoutTime && !forceCheckout) {
      const [hours, minutes] = settings.autoCheckoutTime.split(':').map(Number);
      const autoCheckoutTime = new Date();
      autoCheckoutTime.setHours(hours, minutes, 0, 0);

      // If it's not yet time to auto-checkout, return early
      if (now < autoCheckoutTime) {
        return NextResponse.json({
          message: 'Not yet time for auto-checkout',
          checked_out: false,
          next_checkout: autoCheckoutTime.toISOString(),
        });
      }

      // Use the configured auto-checkout time
      checkOutTime = autoCheckoutTime;
    }

    // Calculate total hours
    const totalHours = calculateTotalHours(new Date(attendance.checkInTime), checkOutTime, {
      maxHoursPerDay: WORK_DAY.MAX_HOURS_PER_DAY,
      isAutoCheckout: true,
    });

    // Get location name (if coordinates are available)
    const locationName = await getLocationName(null, null);

    // Update attendance record with check-out information
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime,
        checkOutLocationName: locationName,
        checkOutIpAddress: req.headers.get('x-forwarded-for') || null,
        checkOutDeviceInfo: req.headers.get('user-agent') || null,
        totalHours,
        autoCheckout: true, // Flag as auto-checkout
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: ACTION_TYPES.AUTO_CHECKOUT,
        entityType: 'attendance',
        entityId: attendance.id,
        description: `System performed automatic checkout (${totalHours} hours) based on user settings`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      message: 'Auto-checkout successful',
      checked_out: true,
      attendance: updatedAttendance,
      checkOutTime: checkOutTime.toISOString(),
      totalHours,
    });
  } catch (error: any) {
    console.error('Error during auto-checkout:', error);
    return NextResponse.json(
      { error: 'Failed to perform auto-checkout', details: error.message },
      { status: 500 }
    );
  }
}
