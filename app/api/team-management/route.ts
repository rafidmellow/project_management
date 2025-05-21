import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';
import { withAuth, withPermission } from '@/lib/api-middleware';
import { PermissionService } from '@/lib/permissions/unified-permission-service';
import { logActivity } from '@/lib/activity-logger';

// Validation schema for creating team members
const teamMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
});

/**
 * GET /api/team-management
 * Get team members with pagination and filtering
 *
 * Query parameters:
 * - projectId: Filter by project
 * - userId: Filter by user
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - search: Search by user name or email
 */
export const GET = withAuth(async (req: NextRequest, context: any, session: any) => {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    // Build filter
    const where: any = {};

    if (projectId) {
      where.projectId = projectId;

      // Check if user has access to the project
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          teamMembers: {
            where: { userId: session.user.id },
          },
        },
      });

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      // Check if user has permission to view this project's team
      const isTeamMember = project.teamMembers.length > 0;
      const isProjectCreator = project.createdById === session.user.id;
      const hasTeamViewPermission = await PermissionService.hasPermissionById(
        session.user.id,
        'team_view'
      );

      // Log permission check details for debugging
      console.log('Team permission check:', {
        projectId,
        userId: session.user.id,
        isTeamMember,
        isProjectCreator,
        hasTeamViewPermission,
      });

      if (!isTeamMember && !isProjectCreator && !hasTeamViewPermission) {
        return NextResponse.json(
          { error: "You don't have permission to view this project's team" },
          { status: 403 }
        );
      }
    }

    if (userId) {
      where.userId = userId;

      // If requesting team memberships for another user, check if the current user has permission
      if (userId !== session.user.id) {
        const hasUserManagementPermission = await PermissionService.hasPermissionById(
          session.user.id,
          'user_management'
        );
        const hasTeamViewPermission = await PermissionService.hasPermissionById(
          session.user.id,
          'team_view'
        );
        const hasPermission = hasUserManagementPermission || hasTeamViewPermission;

        if (!hasPermission) {
          return NextResponse.json(
            { error: "You don't have permission to view team memberships for other users" },
            { status: 403 }
          );
        }
      }
    }

    if (search) {
      where.user = {
        OR: [
          // MySQL doesn't support mode: 'insensitive', use contains without mode
          // MySQL is case-insensitive by default with utf8mb4_unicode_ci collation
          { name: { contains: search } },
          { email: { contains: search } },
        ],
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

    // Add task count for each team member if projectId is provided
    let teamMembersWithTaskCount = teamMembers;

    if (projectId) {
      teamMembersWithTaskCount = await Promise.all(
        teamMembers.map(async member => {
          const taskCount = await prisma.taskAssignee.count({
            where: {
              userId: member.userId,
              task: {
                projectId: member.projectId,
              },
            },
          });

          return {
            ...member,
            taskCount,
          };
        })
      );
    }

    return NextResponse.json({
      teamMembers: teamMembersWithTaskCount,
      pagination: {
        totalCount,
        page,
        pageSize: limit,
        pageCount: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching team members' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/team-management
 * Add a team member to a project
 */
export const POST = withPermission(
  'team_add',
  async (req: NextRequest, context: any, session: any) => {
    try {
      // Parse request body
      const body = await req.json();

      // Validate request body
      const validationResult = teamMemberSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation error', details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { userId, projectId } = validationResult.data;

      // Check if the user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Check if the project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          teamMembers: {
            where: { userId: session.user.id },
          },
        },
      });

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      // Check if user has permission to add team members to this project
      const isTeamMember = project.teamMembers.length > 0;
      const isProjectCreator = project.createdById === session.user.id;
      const hasTeamAddPermission = await PermissionService.hasPermissionById(
        session.user.id,
        'team_add'
      );

      if (!isTeamMember && !isProjectCreator && !hasTeamAddPermission) {
        return NextResponse.json(
          { error: "You don't have permission to add team members to this project" },
          { status: 403 }
        );
      }

      // Check if the user is already a team member
      const existingTeamMember = await prisma.teamMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      if (existingTeamMember) {
        return NextResponse.json(
          { error: 'User is already a team member of this project' },
          { status: 409 }
        );
      }

      // Add the user to the team
      const teamMember = await prisma.teamMember.create({
        data: {
          projectId,
          userId,
        },
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
        },
      });

      // Log the activity
      await logActivity({
        action: 'added_team_member',
        entityType: 'project',
        entityId: projectId,
        description: `Added ${user.name || user.email} to the project team`,
        userId: session.user.id,
        projectId,
      });

      return NextResponse.json(teamMember, { status: 201 });
    } catch (error) {
      console.error('Error adding team member:', error);
      return NextResponse.json(
        { error: 'An error occurred while adding the team member' },
        { status: 500 }
      );
    }
  }
);
