import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getLocationName } from '@/lib/geo-utils';
import { AttendanceCheckInDTO, AttendanceResponse } from '@/types/attendance';

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { latitude, longitude, projectId, taskId, notes }: AttendanceCheckInDTO = body;

    // Check if user already has an active attendance record (checked in but not checked out)
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        checkOutTime: null,
      },
      orderBy: {
        checkInTime: 'desc',
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        {
          error: 'You are already checked in',
          attendance: existingAttendance,
        },
        { status: 400 }
      );
    }

    // Get location name if coordinates are provided
    let locationName = null;
    if (latitude && longitude) {
      try {
        locationName = await getLocationName(latitude, longitude);
      } catch (error) {
        console.error('Error getting location name:', error);
      }
    }

    // Create new attendance record
    const attendance = await prisma.attendance.create({
      data: {
        userId: session.user.id,
        checkInLatitude: latitude || null,
        checkInLongitude: longitude || null,
        checkInLocationName: locationName,
        checkInIpAddress: req.headers.get('x-forwarded-for') || null,
        checkInDeviceInfo: req.headers.get('user-agent') || null,
        projectId: projectId || null,
        taskId: taskId || null,
        notes: notes || null,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'checked-in',
        entityType: 'attendance',
        entityId: attendance.id,
        description: 'User checked in',
        userId: session.user.id,
      },
    });

    // Return response with proper type
    const response: AttendanceResponse = {
      attendance,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });
  }
}
