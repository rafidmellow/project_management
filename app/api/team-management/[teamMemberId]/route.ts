import { NextRequest, NextResponse } from 'next/server';
import { Session } from 'next-auth';
import prisma from '@/lib/prisma';
import { withResourcePermission } from '@/lib/api-middleware';
import { checkTeamMemberPermission } from '@/lib/permissions/team-permissions';
import { logActivity } from '@/lib/activity-logger';

/**
 * GET /api/team-management/[teamMemberId]
 * Get a specific team member
 */
export const GET = withResourcePermission(
  'teamMemberId',
  checkTeamMemberPermission,
  async (req: NextRequest, context: any, session: Session, teamMemberId: string) => {
    try {
      // Get the team member with user and project details
      const teamMember = await prisma.teamMember.findUnique({
        where: { id: teamMemberId },
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
      });

      if (!teamMember) {
        return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
      }

      // Get task count for the team member
      const taskCount = await prisma.taskAssignee.count({
        where: {
          userId: teamMember.userId,
          task: {
            projectId: teamMember.projectId,
          },
        },
      });

      return NextResponse.json({
        teamMember: {
          ...teamMember,
          taskCount,
        },
      });
    } catch (error) {
      console.error('Error fetching team member:', error);
      return NextResponse.json(
        { error: 'An error occurred while fetching the team member' },
        { status: 500 }
      );
    }
  },
  'view'
);

/**
 * DELETE /api/team-management/[teamMemberId]
 * Remove a team member from a project
 */
export const DELETE = withResourcePermission(
  'teamMemberId',
  checkTeamMemberPermission,
  async (req: NextRequest, context: any, session: Session, teamMemberId: string) => {
    try {
      // Get the team member to be deleted
      const teamMember = await prisma.teamMember.findUnique({
        where: { id: teamMemberId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
              createdById: true,
            },
          },
        },
      });

      if (!teamMember) {
        return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
      }

      // Prevent removing the project creator
      if (teamMember.userId === teamMember.project.createdById) {
        return NextResponse.json(
          { error: 'Cannot remove the project creator from the team' },
          { status: 403 }
        );
      }

      // Delete the team member
      await prisma.teamMember.delete({
        where: { id: teamMemberId },
      });

      // Log the activity
      await logActivity({
        action: 'removed_team_member',
        entityType: 'project',
        entityId: teamMember.projectId,
        description: `Removed ${teamMember.user.name || teamMember.user.email} from the project team`,
        userId: session.user.id,
        projectId: teamMember.projectId,
      });

      return NextResponse.json({
        success: true,
        message: 'Team member removed successfully',
      });
    } catch (error) {
      console.error('Error removing team member:', error);
      return NextResponse.json(
        { error: 'An error occurred while removing the team member' },
        { status: 500 }
      );
    }
  },
  'delete'
);
