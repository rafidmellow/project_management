import { NextRequest, NextResponse } from 'next/server';
import { Session } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { checkTaskPermission } from '@/lib/permissions/task-permissions';
import { getTaskIncludeObject } from '@/lib/queries/task-queries';
import { Prisma } from '@prisma/client';
import { toggleTaskCompletion } from '@/lib/utils/task-utils';
import { withResourcePermission } from '@/lib/api-middleware';
import { UpdateTaskDTO } from '@/types/task';

// GET handler to get a task by ID
export const GET = withResourcePermission(
  'taskId',
  checkTaskPermission,
  async (_req: NextRequest, _context: any, _session: Session, taskId: string) => {
    try {
      // Get task with full details - include 3 levels of subtasks and activities
      const taskWithDetails = await prisma.task.findUnique({
        where: { id: taskId },
        include: getTaskIncludeObject(3, true, 5), // 3 levels deep, include activities, 5 activities max
      });

      return NextResponse.json({ task: taskWithDetails });
    } catch (error: unknown) {
      // Provide more detailed error information
      let errorMessage = 'An error occurred while fetching the task';
      let errorDetails: Record<string, unknown> = {};

      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = { stack: error.stack };

        // Check for Prisma-specific errors
        if (error.message.includes('Unknown field')) {
          errorMessage = 'Database schema mismatch: field is missing';
          errorDetails = {
            ...errorDetails,
            hint: "The Prisma client needs to be regenerated. Run 'npx prisma generate' to update it.",
          };
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
  },
  'view'
);

// Validation schema for updating a task
const updateTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  estimatedTime: z.number().optional().nullable(),
  timeSpent: z.number().optional().nullable(),
  statusId: z.string().optional().nullable(),
  toggleCompletion: z.boolean().optional(), // New field to toggle completion status
  assigneeIds: z.array(z.string()).optional(),
  projectId: z.string().optional(),
  parentId: z.string().optional().nullable(),
});

// PATCH handler to update a task
export const PATCH = withResourcePermission(
  'taskId',
  checkTaskPermission,
  async (req: NextRequest, _context: any, _session: Session, taskId: string) => {
    try {
      const body = await req.json();

      const validationResult = updateTaskSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation error', details: validationResult.error.format() },
          { status: 400 }
        );
      }

      // Get the task to update
      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const {
        title,
        description,
        priority,
        startDate,
        endDate,
        dueDate,
        estimatedTime,
        timeSpent,
        statusId,
        toggleCompletion,
        assigneeIds,
        projectId,
        parentId,
      } = validationResult.data;

      // Handle completion toggle if requested
      if (toggleCompletion === true) {
        try {
          const updatedTask = await toggleTaskCompletion(taskId);
          return NextResponse.json({ task: updatedTask });
        } catch (error) {
          return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to toggle task completion' },
            { status: 500 }
          );
        }
      }

      // Prepare update data (direct fields)
      const updateData: Prisma.TaskUpdateInput = {};

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority !== undefined) updateData.priority = priority;
      if (statusId !== undefined) {
        updateData.status = statusId ? { connect: { id: statusId } } : { disconnect: true };
      }
      if (parentId !== undefined)
        updateData.parent = parentId ? { connect: { id: parentId } } : { disconnect: true };
      if (estimatedTime !== undefined) updateData.estimatedTime = estimatedTime;
      if (timeSpent !== undefined) updateData.timeSpent = timeSpent;

      // Handle nullable date fields
      if (startDate !== undefined) {
        updateData.startDate = startDate ? new Date(startDate) : null;
      }
      if (endDate !== undefined) {
        updateData.endDate = endDate ? new Date(endDate) : null;
      }
      if (dueDate !== undefined) {
        updateData.dueDate = dueDate ? new Date(dueDate) : null;
      }

      // Handle project change (if allowed and provided)
      if (projectId !== undefined && projectId !== task.projectId) {
        // Add permission check if project change is allowed
        // For now, assume it's allowed if the user has update permission on the *current* task
        // Verify the target project exists
        const targetProject = await prisma.project.findUnique({ where: { id: projectId } });
        if (!targetProject) {
          return NextResponse.json({ error: 'Target project not found' }, { status: 404 });
        }
        updateData.project = { connect: { id: projectId } };
        // Reset status if project changes, as status is project-specific
        updateData.status = { disconnect: true };
      }

      // -- Start Transaction for Assignee Update --
      const updatedTask = await prisma.$transaction(async tx => {
        // Update direct task fields first
        await tx.task.update({
          where: { id: taskId },
          data: updateData,
        });

        // Handle assignee updates only if assigneeIds is provided in the request
        if (assigneeIds !== undefined) {
          // Get current assignees
          const currentAssignees = await tx.taskAssignee.findMany({
            where: { taskId: taskId },
            select: { userId: true },
          });
          const currentUserIds = currentAssignees.map(a => a.userId);

          // Determine assignees to add and remove
          const assigneesToAdd = assigneeIds.filter(id => !currentUserIds.includes(id));
          const assigneesToRemove = currentUserIds.filter(id => !assigneeIds.includes(id));

          // Remove old assignees
          if (assigneesToRemove.length > 0) {
            await tx.taskAssignee.deleteMany({
              where: {
                taskId: taskId,
                userId: { in: assigneesToRemove },
              },
            });
          }

          // Add new assignees
          if (assigneesToAdd.length > 0) {
            // Verify new assignees exist
            const validUsers = await tx.user.findMany({
              where: { id: { in: assigneesToAdd } },
              select: { id: true },
            });
            const validUserIds = validUsers.map(u => u.id);

            if (validUserIds.length !== assigneesToAdd.length) {
              throw new Error('One or more assignee IDs are invalid.');
            }

            await tx.taskAssignee.createMany({
              data: assigneesToAdd.map(userId => ({ taskId, userId })),
            });
          }
        }

        // Fetch the final task state with includes for the response
        return tx.task.findUnique({
          where: { id: taskId },
          include: getTaskIncludeObject(1), // Include 1 level deep for response
        });
      });
      // -- End Transaction --

      return NextResponse.json({ task: updatedTask });
    } catch (error: unknown) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : 'An error occurred while updating the task',
        },
        { status: 500 }
      );
    }
  },
  'update'
);

// DELETE handler to delete a task
export const DELETE = withResourcePermission(
  'taskId',
  checkTaskPermission,
  async (_req: NextRequest, _context: any, _session: Session, taskId: string) => {
    try {
      // Get the task to delete
      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      // Check if task has subtasks
      const subtasksCount = await prisma.task.count({
        where: { parentId: taskId },
      });

      try {
        // Delete task
        await prisma.task.delete({
          where: { id: taskId },
        });
      } catch (deleteError) {
        // Check if this is a foreign key constraint error
        if (
          deleteError instanceof Error &&
          deleteError.message.includes('foreign key constraint')
        ) {
          // Try to delete all subtasks first

          try {
            // Delete all subtasks
            await prisma.task.deleteMany({
              where: { parentId: taskId },
            });

            // Now try to delete the task again
            await prisma.task.delete({
              where: { id: taskId },
            });
          } catch (cascadeError) {
            throw cascadeError;
          }
        } else {
          throw deleteError;
        }
      }

      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      // Provide more detailed error information
      let errorMessage = 'An error occurred while deleting the task';
      let errorDetails: Record<string, unknown> = {};

      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = { stack: error.stack };

        // Check for specific error types
        if (error.message.includes('foreign key constraint')) {
          errorMessage = 'Cannot delete this task because it has related items';
          errorDetails = {
            ...errorDetails,
            hint: 'You may need to delete subtasks first.',
          };
        } else if (error.message.includes('Record to delete does not exist')) {
          errorMessage = "The task you're trying to delete no longer exists";
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
  },
  'delete'
);
