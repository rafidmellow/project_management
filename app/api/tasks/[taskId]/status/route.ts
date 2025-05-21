import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';
import { PermissionService } from '@/lib/permissions/unified-permission-service';
import { Task } from '@/types/task';
import { ProjectStatus } from '@/types/project';
import { updateTaskStatus } from '@/lib/utils/task-utils';

// PATCH: Update a task's status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.taskId;

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            teamMembers: {
              where: { userId: session.user.id },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user has permission to update the task
    const isTeamMember = task.project.teamMembers.some(tm => tm.userId === session.user.id);
    const hasTaskManagementPermission = await PermissionService.hasPermissionById(
      session.user.id,
      'task_management'
    );

    if (!isTeamMember && !hasTaskManagementPermission) {
      return NextResponse.json(
        { error: "You don't have permission to update this task" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validate request body
    const schema = z.object({
      statusId: z.string(),
      order: z.number().optional(), // Optional order parameter
    });

    const validationResult = schema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { statusId, order } = validationResult.data;

    // Verify the status exists and belongs to the task's project
    const status = await prisma.projectStatus.findFirst({
      where: {
        id: statusId,
        projectId: task.projectId,
      },
    });

    if (!status) {
      return NextResponse.json(
        { error: "Status not found or does not belong to the task's project" },
        { status: 404 }
      );
    }

    // Get the old status for activity logging
    const oldStatus = task.statusId
      ? await prisma.projectStatus.findUnique({
          where: { id: task.statusId },
          select: { name: true },
        })
      : null;

    // Use the updateTaskStatus utility function to ensure consistency
    // between status and completion state, and handle ordering
    const updatedTask = await updateTaskStatus(taskId, statusId, order);

    // Create activity record
    await prisma.activity.create({
      data: {
        action: 'status_changed',
        entityType: 'task',
        entityId: taskId,
        description: `Task "${updatedTask.title}" moved from ${
          oldStatus ? `"${oldStatus.name}"` : 'no status'
        } to "${status.name}"`,
        userId: session.user.id,
        projectId: task.projectId,
        taskId,
      },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('Error updating task status:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the task status' },
      { status: 500 }
    );
  }
}
