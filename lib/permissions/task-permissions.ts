import { Session } from 'next-auth';
import prisma from '@/lib/prisma';
import { PermissionService } from '@/lib/permissions/unified-permission-service';

/**
 * Check if a user has permission to access a task
 * @param taskId The ID of the task to check
 * @param session The user's session
 * @param action The action being performed (view, update, delete, create)
 * @returns An object with hasPermission, task, and error properties
 */
export async function checkTaskPermission(
  taskId: string,
  session: Session | null,
  action: string = 'view'
): Promise<{
  hasPermission: boolean;
  task: any | null;
  error: string | null;
}> {
  // If no session, no permission
  if (!session || !session.user?.id) {
    return { hasPermission: false, task: null, error: 'Unauthorized' };
  }

  // For create action, we only need to check the permission
  if (action === 'create') {
    const hasPermission = await PermissionService.hasPermissionById(
      session.user.id,
      'task_creation'
    );

    return {
      hasPermission,
      task: null,
      error: hasPermission ? null : "You don't have permission to create tasks",
    };
  }

  // Get the task with related data needed for permission checks
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          teamMembers: {
            where: {
              userId: session.user.id,
            },
          },
        },
      },
      assignees: {
        where: {
          userId: session.user.id,
        },
      },
    },
  });

  // If task doesn't exist, no permission
  if (!task) {
    return { hasPermission: false, task: null, error: 'Task not found' };
  }

  // Check if user is the project creator
  const isProjectCreator = task.project.createdById === session.user.id;

  // Check if user is a team member of the project
  const isTeamMember = task.project.teamMembers.length > 0;

  // Check if user is assigned to the task (via TaskAssignee model)
  const isTaskAssignee = task.assignees && task.assignees.length > 0;

  // Initialize permission flag
  let hasPermission = false;

  // Check permissions based on action
  if (action === 'view') {
    // For view actions, check view_projects permission or direct involvement
    const hasViewPermission = await PermissionService.hasPermissionById(
      session.user.id,
      'view_projects'
    );
    hasPermission = hasViewPermission || isProjectCreator || isTeamMember || isTaskAssignee;
  } else if (action === 'update') {
    // For update actions, check task_management permission or direct involvement
    const hasManagePermission = await PermissionService.hasPermissionById(
      session.user.id,
      'task_management'
    );
    hasPermission = hasManagePermission || isProjectCreator || isTaskAssignee;
  } else if (action === 'delete') {
    // For delete actions, check task_deletion permission or project creator status
    const hasDeletePermission = await PermissionService.hasPermissionById(
      session.user.id,
      'task_deletion'
    );
    hasPermission = hasDeletePermission || isProjectCreator;

    // Special case for subtasks - check if user has permission on the parent task
    if (!hasPermission && task.parentId) {
      const parentPermission = await checkTaskPermission(task.parentId, session, 'update');
      hasPermission = parentPermission.hasPermission;
    }
  }

  return {
    hasPermission,
    task,
    error: hasPermission ? null : "You don't have permission to " + action + ' this task',
  };
}
