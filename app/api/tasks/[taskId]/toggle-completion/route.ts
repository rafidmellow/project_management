import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';
import { checkTaskPermission } from '@/lib/permissions/task-permissions';
import { toggleTaskCompletion } from '@/lib/utils/task-utils';
import { ApiRouteHandlerOneParam, getParams } from '@/lib/api-route-types';

/**
 * POST /api/tasks/[taskId]/toggle-completion
 * Toggle a task's completion status
 */
export const POST: ApiRouteHandlerOneParam<'taskId'> = async (req, { params }) => {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract params safely
    const resolvedParams = await getParams(params);
    const taskId = resolvedParams.taskId;

    // Check if user has permission to update the task
    const { hasPermission, error } = await checkTaskPermission(taskId, session, 'update');

    if (!hasPermission) {
      return NextResponse.json({ error }, { status: error === 'Task not found' ? 404 : 403 });
    }

    // Toggle the task's completion status
    const updatedTask = await toggleTaskCompletion(taskId);

    // Create activity record
    await prisma.activity.create({
      data: {
        action: 'completion_toggled',
        entityType: 'task',
        entityId: taskId,
        description: `Task "${updatedTask.title}" completion status toggled to ${updatedTask.completed ? 'completed' : 'not completed'}`,
        userId: session.user?.id || '',
        projectId: updatedTask.project?.id,
        taskId,
      },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('Error toggling task completion:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An error occurred while toggling task completion',
      },
      { status: 500 }
    );
  }
};
