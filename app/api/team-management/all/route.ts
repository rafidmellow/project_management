import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';
import { withAuth } from '@/lib/api-middleware';
import { PermissionService } from '@/lib/permissions/unified-permission-service';

/**
 * GET /api/team-management/all
 * Get all team members across all projects
 * This is a special route to handle the case when projectId is "all"
 */
export const GET = withAuth(async (req: NextRequest, context: any, session: any) => {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    // Check if user has permission to view all team members
    const hasTeamViewPermission = await PermissionService.hasPermissionById(
      session.user.id,
      'team_view'
    );

    // Get projects the user has access to
    const userProjects = await prisma.project.findMany({
      where: {
        OR: [
          { createdById: session.user.id },
          {
            teamMembers: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    const projectIds = userProjects.map(project => project.id);

    // Build filter
    const where: any = {
      projectId: {
        in: projectIds,
      },
    };

    if (search) {
      where.user = {
        OR: [{ name: { contains: search } }, { email: { contains: search } }],
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.teamMember.count({ where });

    // Get team members with user details
    const teamMembers = await prisma.teamMember.findMany({
      where,
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
            description: true,
            createdById: true,
            createdAt: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      teamMembers,
      pagination: {
        totalCount,
        page,
        pageSize: limit,
        pageCount: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching all team members:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching team members' },
      { status: 500 }
    );
  }
});
