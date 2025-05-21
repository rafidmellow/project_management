import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
// Make sure we're using the properly initialized singleton Prisma client
import prisma from '@/lib/prisma';
import { ActivityWhereInput, PaginationResult } from '@/types';

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '5');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const projectId = url.searchParams.get('projectId');
    const userId = url.searchParams.get('userId');

    // Build the where clause
    const where: ActivityWhereInput = {};

    // Filter by project if provided
    if (projectId) {
      where.projectId = projectId;
    }

    // Filter by user if provided
    if (userId) {
      where.userId = userId;
    }

    // Get activities
    const activities = await prisma.activity.findMany({
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
      },
    });

    // Get total count for pagination
    const totalCount = await prisma.activity.count({
      where,
    });

    // Create pagination result
    const pagination: PaginationResult = {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };

    return NextResponse.json({
      activities,
      pagination,
    });
  } catch (error) {
    console.error('Get activities error:', error);
    return NextResponse.json({ error: 'Failed to retrieve activities' }, { status: 500 });
  }
}
