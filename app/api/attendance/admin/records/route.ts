import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { PermissionService } from '@/lib/permissions/unified-permission-service';

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
        { error: 'Forbidden: You do not have permission to access attendance records' },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const userId = url.searchParams.get('userId');
    const projectId = url.searchParams.get('projectId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build the where clause
    const where: any = {};

    // Add filters if provided
    if (userId) {
      where.userId = userId;
    }

    if (projectId) {
      where.projectId = projectId;
    }

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

    // Get total count for pagination
    const totalCount = await prisma.attendance.count({ where });

    // Get attendance records with user information
    const attendanceRecords = await prisma.attendance.findMany({
      where,
      orderBy: {
        checkInTime: 'desc',
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
        correctionRequests: {
          where: {
            status: 'pending',
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    // Calculate summary statistics
    const totalHours = await prisma.attendance.aggregate({
      where,
      _sum: {
        totalHours: true,
      },
    });

    const uniqueUsers = await prisma.attendance.findMany({
      where,
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    // Return the response
    return NextResponse.json({
      attendanceRecords,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        totalRecords: totalCount,
        totalHours: totalHours._sum.totalHours || 0,
        uniqueUsers: uniqueUsers.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve attendance records' }, { status: 500 });
  }
}
