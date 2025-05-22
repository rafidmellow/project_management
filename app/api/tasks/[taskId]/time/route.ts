import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';

// Validation schema for updating task time
const updateTaskTimeSchema = z.object({
  timeSpent: z.number().min(0),
  updateProjectTotal: z.boolean().default(true),
});

// PATCH handler to update task time
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract taskId from params (await required in App Router)
    const { taskId } = await params;

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
    const validationResult = updateTaskTimeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { timeSpent, updateProjectTotal } = validationResult.data;

    // Get the current time spent on the task
    const currentTimeSpent = task.timeSpent || 0;
    const timeDifference = timeSpent - currentTimeSpent;

    // Update the task's time spent
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { timeSpent },
      include: {
        project: true,
        status: true,
      },
    });

    // Update the project's total time spent if requested
    if (updateProjectTotal && timeDifference !== 0) {
      const project = await prisma.project.findUnique({
        where: { id: task.projectId },
        select: { totalTimeSpent: true },
      });

      const currentProjectTime = project?.totalTimeSpent || 0;
      const newProjectTime = currentProjectTime + timeDifference;

      await prisma.project.update({
        where: { id: task.projectId },
        data: { totalTimeSpent: Math.max(0, newProjectTime) },
      });
    }

    // Create activity record
    await prisma.activity.create({
      data: {
        action: 'updated_time',
        entityType: 'task',
        entityId: taskId,
        description: `Updated time spent on task "${task.title}" to ${timeSpent} hours`,
        userId: session.user.id,
        projectId: task.projectId,
        taskId,
      },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('Error updating task time:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the task time' },
      { status: 500 }
    );
  }
}
