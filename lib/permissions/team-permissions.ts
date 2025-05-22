import { Session } from 'next-auth';
import prisma from '@/lib/prisma';
import { PermissionService } from '@/lib/permissions/unified-permission-service';
import { logActivity } from '@/lib/activity-logger';

/**
 * Check if a user has permission to access a team member
 * @param teamMemberId The ID of the team member to check
 * @param session The user's session
 * @param action The action being performed (view, update, delete)
 * @returns An object with hasPermission, teamMember, and error properties
 */
export async function checkTeamMemberPermission(
  teamMemberId: string,
  session: Session | null,
  action?: string | undefined
): Promise<{
  hasPermission: boolean;
  error?: string | null | undefined;
  task?: any;
  teamMember?: any;
  project?: any;
}> {
  // If no session, no permission
  if (!session || !session.user?.id) {
    return { hasPermission: false, error: 'Unauthorized' };
  }

  // Get the team member with project and user details
  const teamMember = await prisma.teamMember.findUnique({
    where: { id: teamMemberId },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          createdById: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!teamMember) {
    return { hasPermission: false, error: 'Team member not found' };
  }

  // Check if user is part of the same project
  const userTeamMember = await prisma.teamMember.findUnique({
    where: {
      projectId_userId: {
        projectId: teamMember.projectId,
        userId: session.user.id,
      },
    },
  });

  // Get user ID
  const userId = session.user.id;

  // Check if user is the project creator
  const isProjectCreator = teamMember.project.createdById === userId;

  // Check if user is the team member themselves
  const isSelf = teamMember.userId === userId;

  let hasPermission = false;

  // Determine permission based on action
  const actionType = action || 'view';
  if (actionType === 'view') {
    // For view actions, check team_view permission or direct involvement
    const hasViewPermission = await PermissionService.hasPermissionById(userId, 'team_view');
    hasPermission = hasViewPermission || isProjectCreator || !!userTeamMember || isSelf;
  } else if (actionType === 'update') {
    // For update actions, check team_management permission or project creator status
    const hasManagementPermission = await PermissionService.hasPermissionById(
      userId,
      'team_management'
    );
    hasPermission = hasManagementPermission || isProjectCreator;

    // Special case: can't update project creator's membership
    if (teamMember.project.createdById === teamMember.userId) {
      return {
        hasPermission: false,
        teamMember,
        error: "Cannot update the project creator's membership",
      };
    }
  } else if (actionType === 'delete') {
    // For delete actions, check team_remove permission or project creator status or self
    const hasRemovePermission = await PermissionService.hasPermissionById(userId, 'team_remove');
    hasPermission = hasRemovePermission || isProjectCreator || isSelf;

    // Special case: can't remove project creator
    if (teamMember.project.createdById === teamMember.userId) {
      return {
        hasPermission: false,
        teamMember,
        error: 'Cannot remove the project creator from the team',
      };
    }
  }

  // Log the permission check
  const result = {
    hasPermission,
    teamMember,
    error: hasPermission ? null : `You don't have permission to ${actionType} this team member`,
  };

  // Log permission checks for audit purposes (only log failures)
  if (!hasPermission) {
    console.warn(
      `Permission denied: User ${session.user.id} attempted to ${actionType} team member ${teamMemberId}`
    );

    try {
      await logActivity({
        userId: session.user.id,
        action: 'permission_denied',
        entityType: 'TeamMember',
        entityId: teamMemberId,
        description: `Permission denied: User attempted to ${actionType} team member ${teamMember.user.name || teamMember.user.email}`,
        projectId: teamMember.projectId,
      });
    } catch (error) {
      console.error('Failed to log permission denial:', error);
    }
  }

  return result;
}

/**
 * Check if a user has permission to manage team members in a project
 * @param projectId The ID of the project to check
 * @param session The user's session
 * @param action The action being performed (view, add, manage)
 * @returns An object with hasPermission, project, and error properties
 */
export async function checkProjectTeamPermission(
  projectId: string,
  session: Session | null,
  action: 'view' | 'add' | 'manage' = 'view'
): Promise<{
  hasPermission: boolean;
  project: any | null;
  error: string | null;
}> {
  // If no session, no permission
  if (!session || !session.user?.id) {
    return { hasPermission: false, project: null, error: 'Unauthorized' };
  }

  // Get the project
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return { hasPermission: false, project: null, error: 'Project not found' };
  }

  // Get user ID
  const userId = session.user.id;

  // Check if user is the project creator
  const isProjectCreator = project.createdById === userId;

  // Check if user is a team member
  const teamMember = await prisma.teamMember.findUnique({
    where: {
      projectId_userId: {
        projectId: projectId,
        userId: userId,
      },
    },
  });

  const isTeamMember = !!teamMember;

  let hasPermission = false;

  // Determine permission based on action
  if (action === 'view') {
    // For view actions, check team_view permission or direct involvement
    const hasViewPermission = await PermissionService.hasPermissionById(userId, 'team_view');
    hasPermission = hasViewPermission || isProjectCreator || isTeamMember;
  } else if (action === 'add') {
    // For add actions, check team_add permission or project creator status
    const hasAddPermission = await PermissionService.hasPermissionById(userId, 'team_add');
    hasPermission = hasAddPermission || isProjectCreator;
  } else if (action === 'manage') {
    // For manage actions, check team_management permission or project creator status
    const hasManagementPermission = await PermissionService.hasPermissionById(
      userId,
      'team_management'
    );
    hasPermission = hasManagementPermission || isProjectCreator;
  }

  return {
    hasPermission,
    project,
    error: hasPermission
      ? null
      : `You don't have permission to ${action} team members in this project`,
  };
}
