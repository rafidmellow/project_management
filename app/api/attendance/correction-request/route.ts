import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for correction requests
const correctionRequestSchema = z.object({
  attendanceId: z.string(),
  requestedCheckInTime: z.string().datetime(),
  requestedCheckOutTime: z.string().datetime().nullable().optional(),
  reason: z.string().min(5, 'Please provide a detailed reason for the correction'),
});

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = correctionRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { attendanceId, requestedCheckInTime, requestedCheckOutTime, reason } =
      validationResult.data;

    // Verify the attendance record exists and belongs to the user
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!attendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }

    if (attendance.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only request corrections for your own attendance records' },
        { status: 403 }
      );
    }

    // Create the correction request
    const correctionRequest = await prisma.attendanceCorrectionRequest.create({
      data: {
        attendanceId,
        userId: session.user.id,
        originalCheckInTime: attendance.checkInTime,
        originalCheckOutTime: attendance.checkOutTime,
        requestedCheckInTime: new Date(requestedCheckInTime),
        requestedCheckOutTime: requestedCheckOutTime ? new Date(requestedCheckOutTime) : null,
        reason,
        status: 'pending',
      },
    });

    // Log the correction request activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        action: 'correction-requested',
        entityType: 'attendance',
        entityId: attendanceId,
        description: `Requested correction for attendance record: ${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}`,
      },
    });

    return NextResponse.json({
      message: 'Correction request submitted successfully',
      correctionRequest,
    });
  } catch (error: any) {
    console.error('Error submitting correction request:', error);
    return NextResponse.json(
      { error: 'Failed to submit correction request', details: error.message },
      { status: 500 }
    );
  }
}
