import prisma from '@/lib/prisma';

/**
 * Default spacing between task orders
 * Using 100 as a default spacing allows for 99 tasks to be inserted between any two tasks
 * without needing to rebalance
 */
export const ORDER_SPACING = 100;

/**
 * Initial order value for the first task in a list
 */
export const INITIAL_ORDER = 1000;

/**
 * Get the next order value for a new task
 * @param projectId The project ID
 * @param parentId The parent task ID (null for top-level tasks)
 * @returns The next order value
 */
export async function getNextOrderValue(
  projectId: string,
  parentId: string | null
): Promise<number> {
  // Get the highest order value for tasks with the same parent
  const highestOrderTask = await prisma.task.findFirst({
    where: {
      projectId,
      parentId: parentId || null,
    },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  // Set the initial order value to be higher than the highest existing order
  return highestOrderTask ? highestOrderTask.order + ORDER_SPACING : INITIAL_ORDER;
}

/**
 * Calculate the order value for a task being moved between two other tasks
 * @param beforeTaskOrder Order value of the task before the insertion point (null if inserting at the beginning)
 * @param afterTaskOrder Order value of the task after the insertion point (null if inserting at the end)
 * @returns The new order value
 */
export function calculateOrderBetween(
  beforeTaskOrder: number | null,
  afterTaskOrder: number | null
): number {
  // If inserting at the beginning
  if (beforeTaskOrder === null && afterTaskOrder !== null) {
    return Math.max(1, afterTaskOrder - ORDER_SPACING);
  }

  // If inserting at the end
  if (afterTaskOrder === null && beforeTaskOrder !== null) {
    return beforeTaskOrder + ORDER_SPACING;
  }

  // If inserting between two tasks
  if (beforeTaskOrder !== null && afterTaskOrder !== null) {
    // Handle the case where the values are too close together
    if (afterTaskOrder - beforeTaskOrder < 2) {
      // Not enough space between tasks, return a value slightly higher than beforeTaskOrder
      return beforeTaskOrder + 1;
    }

    return Math.floor((beforeTaskOrder + afterTaskOrder) / 2);
  }

  // Default case (should not happen in practice)
  return INITIAL_ORDER;
}

/**
 * Rebalance task order values to ensure even spacing
 * @param projectId The project ID
 * @param parentId The parent task ID (null for top-level tasks)
 */
export async function rebalanceTaskOrders(
  projectId: string,
  parentId: string | null
): Promise<void> {
  try {
    // Get all tasks for the given parent, ordered by their current order
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        parentId: parentId || null,
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }, // Secondary sort by creation date
      ],
      select: { id: true },
    });

    // If there are no tasks or just one task, no need to rebalance
    if (tasks.length <= 1) {
      return;
    }

    // Calculate new order values with even spacing
    const updates = tasks.map((task, index) => {
      return prisma.task.update({
        where: { id: task.id },
        data: { order: INITIAL_ORDER + index * ORDER_SPACING },
      });
    });

    // Execute all updates in a transaction
    await prisma.$transaction(updates);

    console.log(
      `Rebalanced ${tasks.length} tasks for project ${projectId}, parent ${parentId || 'none'}`
    );
  } catch (error) {
    console.error('Error rebalancing task orders:', error);
    // Don't rethrow - we want to continue even if rebalancing fails
  }
}

/**
 * Check if task orders need rebalancing
 * @param projectId The project ID
 * @param parentId The parent task ID (null for top-level tasks)
 * @returns True if rebalancing is needed
 */
export async function needsRebalancing(
  projectId: string,
  parentId: string | null
): Promise<boolean> {
  // Get tasks ordered by their current order
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      parentId: parentId || null,
    },
    orderBy: { order: 'asc' },
    select: { id: true, order: true },
  });

  // If there are less than 2 tasks, no need to rebalance
  if (tasks.length < 2) {
    return false;
  }

  // Check if any task has order = 0 (needs initialization)
  const hasZeroOrderTask = tasks.some(task => task.order === 0);
  if (hasZeroOrderTask) {
    return true;
  }

  // Check if any adjacent tasks have order values that are too close
  for (let i = 1; i < tasks.length; i++) {
    const diff = tasks[i].order - tasks[i - 1].order;
    if (diff < 2) {
      return true;
    }
  }

  // Check if the spacing between tasks is highly irregular (some are very close, others far apart)
  const diffs = [];
  for (let i = 1; i < tasks.length; i++) {
    diffs.push(tasks[i].order - tasks[i - 1].order);
  }

  if (diffs.length > 1) {
    const maxDiff = Math.max(...diffs);
    const minDiff = Math.min(...diffs);

    // If the ratio between max and min diff is too high, we should rebalance
    if (maxDiff / minDiff > 100) {
      return true;
    }
  }

  return false;
}
