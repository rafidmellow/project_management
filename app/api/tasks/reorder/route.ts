import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { checkTaskPermission } from '@/lib/permissions/task-permissions';
import {
  calculateOrderBetween,
  rebalanceTaskOrders,
  needsRebalancing,
} from '@/lib/ordering/task-ordering';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    console.log('Reorder API - Session:', JSON.stringify(session, null, 2));

    // Parse request body
    const { taskId, newParentId, oldParentId, targetTaskId, isSameParentReorder } =
      await request.json();

    console.log('Reorder task request:', {
      taskId,
      newParentId,
      oldParentId,
      targetTaskId,
      isSameParentReorder,
    });

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Check permission
    const { hasPermission, task, error } = await checkTaskPermission(taskId, session, 'update');

    if (!hasPermission || !session?.user?.id) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: error === 'Task not found' ? 404 : 403 });
    }

    // If the task doesn't have an order value or it's 0, initialize it
    if (task.order === 0) {
      // Update the task with a default order value
      await prisma.task.update({
        where: { id: taskId },
        data: { order: 1000 },
      });

      // Update our local copy of the task
      task.order = 1000;
      console.log(`Initialized order value for task ${taskId} to 1000`);
    }

    // If newParentId is provided, verify it exists and belongs to the same project
    if (newParentId) {
      const newParent = await prisma.task.findUnique({
        where: { id: newParentId },
        select: { projectId: true },
      });

      if (!newParent) {
        return NextResponse.json({ error: 'New parent task not found' }, { status: 404 });
      }

      if (newParent.projectId !== task.projectId) {
        return NextResponse.json(
          { error: 'Cannot move task to a different project' },
          { status: 400 }
        );
      }

      // Prevent circular references
      if (newParentId === taskId) {
        return NextResponse.json({ error: 'A task cannot be its own parent' }, { status: 400 });
      }

      // Check if the new parent is a descendant of the task (would create a cycle)
      let currentParentId = newParentId;
      while (currentParentId) {
        if (currentParentId === taskId) {
          return NextResponse.json(
            { error: 'Cannot create a circular reference in the task hierarchy' },
            { status: 400 }
          );
        }

        const parent = await prisma.task.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        });

        currentParentId = parent?.parentId || null;
      }
    }

    // Get the task details for the activity log
    const taskDetails = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        title: true,
        projectId: true,
      },
    });

    if (!taskDetails) {
      return NextResponse.json({ error: 'Task details not found' }, { status: 404 });
    }

    // Handle reordering within the same parent vs. changing parent
    let updatedTask;

    if (isSameParentReorder) {
      // This is a reordering operation within the same parent
      // We'll use the explicit order field for proper ordering

      // If no targetTaskId is provided, we'll move the task to the end of its parent's children

      // Get all sibling tasks (tasks with the same parent)
      const parentIdToUse = task.parentId || null;
      let targetTask = null;

      if (targetTaskId) {
        // Get the target task's order value if targetTaskId is provided
        targetTask = await prisma.task.findUnique({
          where: { id: targetTaskId },
          select: { order: true },
        });

        if (!targetTask) {
          return NextResponse.json({ error: 'Target task not found' }, { status: 404 });
        }

        // If the target task doesn't have an order value or it's 0, initialize it
        if (targetTask.order === 0) {
          // Update the target task with a default order value
          await prisma.task.update({
            where: { id: targetTaskId },
            data: { order: 2000 }, // Different from the active task's default
          });

          // Update our local copy of the target task
          targetTask.order = 2000;
        }
      }

      // Get all sibling tasks (tasks with the same parent)
      const siblingTasks = await prisma.task.findMany({
        where: {
          parentId: parentIdToUse,
          projectId: task.projectId,
          id: { not: taskId }, // Exclude the task being moved
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'asc' }, // Fallback to createdAt if order is the same
        ],
        select: { id: true, order: true },
      });

      // Initialize order values for any sibling tasks that have order = 0
      for (let i = 0; i < siblingTasks.length; i++) {
        if (siblingTasks[i].order === 0) {
          // Update the sibling task with a default order value based on its position
          const newOrder = (i + 1) * 1000;
          await prisma.task.update({
            where: { id: siblingTasks[i].id },
            data: { order: newOrder },
          });

          // Update our local copy
          siblingTasks[i].order = newOrder;
        }
      }

      // Calculate the new order value using our utility function
      let newOrder;

      if (targetTask) {
        // If we have a target task, position relative to it
        // Find the task that comes before the target task
        const tasksBefore = siblingTasks.filter(t => t.order < targetTask.order);

        if (tasksBefore.length > 0) {
          // Sort in descending order to get the closest task before the target
          tasksBefore.sort((a, b) => b.order - a.order);
          const prevTask = tasksBefore[0];

          // Calculate order between the previous task and the target task
          newOrder = calculateOrderBetween(prevTask.order, targetTask.order);
        } else {
          // No task before the target, so position before the target
          newOrder = calculateOrderBetween(null, targetTask.order);
        }
      } else {
        // If no target task, move to the end of the list
        // Find the highest order value among siblings
        const highestOrderTask =
          siblingTasks.length > 0
            ? siblingTasks.reduce(
                (max, task) => (task.order > max.order ? task : max),
                siblingTasks[0]
              )
            : null;

        // Calculate order after the highest task (or at the beginning if no siblings)
        newOrder = calculateOrderBetween(highestOrderTask?.order || null, null);
      }

      // Check if we need to rebalance the task orders
      const needsRebalance = await needsRebalancing(task.projectId, parentIdToUse);
      if (needsRebalance) {
        await rebalanceTaskOrders(task.projectId, parentIdToUse);
      }

      updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          order: newOrder,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          title: true,
          parentId: true,
          order: true,
          parent: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    } else {
      // This is a parent change operation
      // When changing parents, we need to:
      // 1. Update the parentId
      // 2. Set the order to be at the end of the new parent's children

      // Get all tasks under the new parent to ensure they have order values
      const newParentTasks = await prisma.task.findMany({
        where: {
          parentId: newParentId || null,
          projectId: task.projectId,
          id: { not: taskId }, // Exclude the task being moved
        },
        orderBy: [
          { order: 'desc' },
          { createdAt: 'desc' }, // Fallback to createdAt if order is the same
        ],
        select: { id: true, order: true },
      });

      // Initialize order values for any tasks that have order = 0
      for (let i = 0; i < newParentTasks.length; i++) {
        if (newParentTasks[i].order === 0) {
          // Update with a default order value based on position
          const newOrder = (newParentTasks.length - i) * 1000; // Reverse order since we sorted desc
          await prisma.task.update({
            where: { id: newParentTasks[i].id },
            data: { order: newOrder },
          });

          // Update our local copy
          newParentTasks[i].order = newOrder;
        }
      }

      // Calculate the new order value using our utility function
      // When changing parents, we typically want to add the task at the end
      const highestOrderTask = newParentTasks.length > 0 ? newParentTasks[0] : null;
      const newOrder = calculateOrderBetween(highestOrderTask?.order || null, null);

      // Check if we need to rebalance the task orders in the new parent
      const needsRebalance = await needsRebalancing(task.projectId, newParentId || null);
      if (needsRebalance) {
        await rebalanceTaskOrders(task.projectId, newParentId || null);
      }

      updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          parentId: newParentId || null,
          order: newOrder,
        },
        select: {
          id: true,
          title: true,
          parentId: true,
          order: true,
          parent: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    }

    // Log the activity
    try {
      // First, verify that the user exists in the database
      const userExists = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true },
      });

      if (!userExists) {
        console.warn(`Activity not created: User ID ${session.user.id} not found in database`);
        // Continue with the task reordering without creating an activity
      } else {
        await prisma.activity.create({
          data: {
            action: isSameParentReorder ? 'reordered' : 'moved',
            entityType: 'task',
            entityId: taskId, // This is the ID of the task being moved
            description: isSameParentReorder
              ? `Subtask "${taskDetails.title}" was reordered within its parent`
              : newParentId
                ? `Task "${taskDetails.title}" was moved to be a subtask of another task`
                : oldParentId
                  ? `Subtask "${taskDetails.title}" was promoted to a top-level task`
                  : `Task "${taskDetails.title}" was reordered`,
            userId: session.user.id,
            projectId: taskDetails.projectId,
            taskId: taskId, // This links the activity to the task
          },
        });
      }
    } catch (activityError) {
      // Log the error but don't fail the task reordering
      console.error('Error creating activity for task reordering:', activityError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Task reordered successfully',
        task: updatedTask,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error reordering task:', error);

    // Provide more detailed error information
    let errorMessage = 'An error occurred while reordering the task';
    let errorDetails = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { stack: error.stack };

      // Check for Prisma-specific errors
      if (error.message.includes('Record to update not found')) {
        errorMessage = 'Task not found or has been deleted';
      } else if (error.message.includes('Foreign key constraint failed')) {
        errorMessage = 'Cannot move task to the specified parent';
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
