import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { PermissionService } from '@/lib/permissions/unified-permission-service';

// Validation schema for correction request updates
const updateCorrectionRequestSchema = z.object({
  id: z.string(),
  status: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().optional(),
});

// GET /api/attendance/admin/correction-requests - Get all correction requests
export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user
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
        { error: 'Forbidden: You do not have permission to access correction requests' },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const status = url.searchParams.get('status');
    const userId = url.searchParams.get('userId');

    // Build the where clause
    const where: any = {};

    // Add filters if provided
    if (status && status !== 'all') {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    // Get total count for pagination
    const totalCount = await prisma.attendanceCorrectionRequest.count({ where });

    // Get correction requests
    const correctionRequests = await prisma.attendanceCorrectionRequest.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        attendance: {
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
          },
        },
      },
    });

    // Return the response
    return NextResponse.json({
      correctionRequests,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Get correction requests error:', error);
    return NextResponse.json({ error: 'Failed to retrieve correction requests' }, { status: 500 });
  }
}

// PATCH /api/attendance/admin/correction-requests - Update a correction request
export async function PATCH(req: NextRequest) {
  try {
    // Get the authenticated user
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
        { error: 'Forbidden: You do not have permission to update correction requests' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = updateCorrectionRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { id, status, reviewNotes } = validationResult.data;

    // Find the correction request
    const correctionRequest = await prisma.attendanceCorrectionRequest.findUnique({
      where: { id },
      include: {
        attendance: true,
      },
    });

    if (!correctionRequest) {
      return NextResponse.json({ error: 'Correction request not found' }, { status: 404 });
    }

    // Update the correction request
    const updatedRequest = await prisma.attendanceCorrectionRequest.update({
      where: { id },
      data: {
        status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
      },
    });

    // If approved, update the attendance record
    if (status === 'approved') {
      await prisma.attendance.update({
        where: { id: correctionRequest.attendanceId },
        data: {
          checkInTime: correctionRequest.requestedCheckInTime,
          checkOutTime: correctionRequest.requestedCheckOutTime,
          // Recalculate total hours if both check-in and check-out times are present
          ...(correctionRequest.requestedCheckOutTime && {
            totalHours: calculateTotalHours(
              correctionRequest.requestedCheckInTime,
              correctionRequest.requestedCheckOutTime
            ),
          }),
        },
      });
    }

    // Log the activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        action: `correction-${status}`,
        entityType: 'attendance',
        entityId: correctionRequest.attendanceId,
        description: `${status === 'approved' ? 'Approved' : 'Rejected'} correction request: ${reviewNotes || 'No notes provided'}`,
      },
    });

    return NextResponse.json({
      message: `Correction request ${status}`,
      correctionRequest: updatedRequest,
    });
  } catch (error) {
    console.error('Update correction request error:', error);
    return NextResponse.json({ error: 'Failed to update correction request' }, { status: 500 });
  }
}

// Helper function to calculate total hours between two dates
function calculateTotalHours(checkInTime: Date, checkOutTime: Date): number {
  const diffMs = checkOutTime.getTime() - checkInTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // Cap at 12 hours maximum per day
  return Math.min(diffHours, 12);
}
