import { Task, ProjectStatus } from '@prisma/client';
import prisma from '@/lib/prisma';

/**
 * Check if a task is completed based on its status or completed field
 * @param task The task to check
 * @returns True if the task is completed
 */
export function isTaskCompleted(
  task: Task & { status?: { isCompletedStatus: boolean } | null }
): boolean {
  // First check the status.isCompletedStatus field (preferred method)
  if (task.status?.isCompletedStatus) {
    return true;
  }

  // Fall back to the completed field if status approach isn't available
  // This is for backward compatibility
  return !!(task as any).completed;
}

/**
 * Get the default completed status for a project
 * @param projectId The project ID
 * @returns The default completed status or null if none exists
 */
export async function getDefaultCompletedStatus(
  projectId: string
): Promise<{ id: string; name: string } | null> {
  const status = await prisma.projectStatus.findFirst({
    where: {
      projectId,
      isCompletedStatus: true,
      isDefault: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (status) return status;

  // If no default completed status exists, try to find any completed status
  return prisma.projectStatus.findFirst({
    where: {
      projectId,
      isCompletedStatus: true,
    },
    select: {
      id: true,
      name: true,
    },
  });
}

/**
 * Get the default non-completed status for a project
 * @param projectId The project ID
 * @returns The default non-completed status or null if none exists
 */
export async function getDefaultNonCompletedStatus(
  projectId: string
): Promise<{ id: string; name: string } | null> {
  const status = await prisma.projectStatus.findFirst({
    where: {
      projectId,
      isCompletedStatus: false,
      isDefault: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (status) return status;

  // If no default non-completed status exists, try to find any non-completed status
  return prisma.projectStatus.findFirst({
    where: {
      projectId,
      isCompletedStatus: false,
    },
    select: {
      id: true,
      name: true,
    },
  });
}

/**
 * Toggle a task's completion status and synchronize with appropriate status
 * @param taskId The task ID
 * @returns The updated task
 */
export async function toggleTaskCompletion(taskId: string) {
  // Get the task with its current status
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      status: true,
      project: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  // Determine the new completion state
  const newCompletedState = !task.completed;

  // Check if we need to update the status based on completion change
  let newStatusId = task.statusId;

  // If completion state is changing, we may need to update the status
  if (task.status) {
    const currentStatusIsCompleted = task.status.isCompletedStatus;

    // If there's a mismatch between status and new completion state, find appropriate status
    if (currentStatusIsCompleted !== newCompletedState) {
      // Find an appropriate status based on the new completion state
      const appropriateStatus = newCompletedState
        ? await getDefaultCompletedStatus(task.projectId)
        : await getDefaultNonCompletedStatus(task.projectId);

      if (appropriateStatus) {
        newStatusId = appropriateStatus.id;
      }
    }
  }

  // Update both the completed field and status if needed
  return prisma.task.update({
    where: { id: taskId },
    data: {
      completed: newCompletedState,
      statusId: newStatusId,
    },
    include: {
      status: true,
      project: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}

/**
 * Update a task's status and synchronize its completion state
 * @param taskId The task ID
 * @param statusId The new status ID
 * @param targetOrder Optional order value for the task in the new status
 * @returns The updated task
 */
export async function updateTaskStatus(taskId: string, statusId: string, targetOrder?: number) {
  // Get the task and target status
  const [task, targetStatus] = await Promise.all([
    prisma.task.findUnique({
      where: { id: taskId },
      include: {
        status: true,
      },
    }),
    prisma.projectStatus.findUnique({
      where: { id: statusId },
    }),
  ]);

  if (!task) {
    throw new Error('Task not found');
  }

  if (!targetStatus) {
    throw new Error('Target status not found');
  }

  // Determine if we need to update the order
  let order = task.order;

  if (targetOrder !== undefined) {
    // Use the provided order
    order = targetOrder;
  } else if (task.statusId !== statusId) {
    // If moving to a new status without specified order, place at the end
    const tasksInTargetStatus = await prisma.task.findMany({
      where: {
        statusId,
        projectId: task.projectId,
      },
      orderBy: { order: 'desc' },
      take: 1,
    });

    order = tasksInTargetStatus.length > 0 ? tasksInTargetStatus[0].order + 1 : 0;
  }

  // Update the task with new status, order, and synchronized completion state
  return prisma.task.update({
    where: { id: taskId },
    data: {
      statusId,
      order,
      // Synchronize completed field with the target status
      completed: targetStatus.isCompletedStatus,
    },
    include: {
      status: true,
      project: {
        select: {
          id: true,
          title: true,
        },
      },
      assignees: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Reorder tasks within a status column
 * @param taskIds Ordered array of task IDs
 * @param statusId The status ID
 * @returns Array of updated tasks
 */
export async function reorderTasks(taskIds: string[], statusId: string) {
  // Update the order of each task
  const updates = taskIds.map((id, index) =>
    prisma.task.update({
      where: { id },
      data: { order: index },
    })
  );

  return Promise.all(updates);
}
