import { Session } from 'next-auth';
import prisma from '@/lib/prisma';
import { PermissionService } from '@/lib/permissions/unified-permission-service';
import { PermissionCheckFn } from '@/types/api';

/**
 * Check if a user has permission to access a project
 * @param projectId The ID of the project to check
 * @param session The user's session
 * @param action The action being performed (view, update, delete, create)
 * @returns An object with hasPermission and project properties
 */
export async function checkProjectPermission(
  projectId: string,
  session: Session | null,
  action: 'view' | 'update' | 'delete' | 'create' = 'view'
) {
  // If no session, no permission
  if (!session || !session.user.id) {
    return { hasPermission: false, project: null, error: 'Unauthorized' };
  }

  // Get the project with related data needed for permission checks
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      teamMembers: {
        where: {
          userId: session.user.id,
        },
      },
    },
  });

  // If project doesn't exist, no permission
  if (!project) {
    return { hasPermission: false, project: null, error: 'Project not found' };
  }

  // Get user ID
  const userId = session.user.id;

  // Check if user is the project creator
  const isProjectCreator = project.createdById === userId;

  // Check if user is a team member of the project
  const isTeamMember = project.teamMembers.length > 0;

  // Initialize permission flag
  let hasPermission = false;

  // Check permissions based on action
  if (action === 'view') {
    // For view actions, check view_projects permission or direct involvement
    const hasViewPermission = await PermissionService.hasPermissionById(userId, 'view_projects');
    hasPermission = hasViewPermission || isProjectCreator || isTeamMember;
  } else if (action === 'update') {
    // For update actions, check project_management permission or project creator status
    const hasManagePermission = await PermissionService.hasPermissionById(
      userId,
      'project_management'
    );
    hasPermission = hasManagePermission || isProjectCreator;
  } else if (action === 'delete') {
    // For delete actions, check project_deletion permission or project creator status
    const hasDeletePermission = await PermissionService.hasPermissionById(
      userId,
      'project_deletion'
    );
    hasPermission = hasDeletePermission || isProjectCreator;
  } else if (action === 'create') {
    // For create actions, check project_creation permission
    hasPermission = await PermissionService.hasPermissionById(userId, 'project_creation');
  }

  return {
    hasPermission,
    project,
    error: hasPermission ? null : "You don't have permission to " + action + ' this project',
  };
}

/**
 * Wrapper for checkProjectPermission that matches the PermissionCheckFn signature
 * for use with withResourcePermission middleware
 */
export const projectPermissionCheck: PermissionCheckFn = async (
  resourceId: string,
  session: Session | null,
  action?: string | undefined
) => {
  const result = await checkProjectPermission(
    resourceId,
    session,
    (action || 'view') as 'view' | 'update' | 'delete' | 'create'
  );

  return {
    hasPermission: result.hasPermission,
    error: result.error || undefined,
    project: result.project || undefined,
  };
};
