import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import { checkTaskPermission } from '@/lib/permissions/task-permissions';
import { PermissionService } from '@/lib/permissions/unified-permission-service';

// Validation schema for creating a comment
const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
});

// GET /api/tasks/[taskId]/comments - Get comments for a task
export async function GET(
  _req: NextRequest,
  { params }: { params: { taskId: string } }
): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = params;

    // Check permission
    const { hasPermission, error } = await checkTaskPermission(taskId, session, 'view');
    if (!hasPermission) {
      return NextResponse.json({ error }, { status: error === 'Task not found' ? 404 : 403 });
    }

    // Get comments for the task
    const comments = await prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
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
    });

    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error('Error fetching task comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task comments', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[taskId]/comments - Add a comment to a task
export async function POST(
  req: NextRequest,
  { params }: { params: { taskId: string } }
): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = params;

    // Check permission
    const { hasPermission, error } = await checkTaskPermission(taskId, session, 'update');
    if (!hasPermission) {
      return NextResponse.json({ error }, { status: error === 'Task not found' ? 404 : 403 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = createCommentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { content } = validationResult.data;

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId: session.user?.id || '',
      },
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
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'commented',
        entityType: 'task',
        entityId: taskId,
        description: `commented on task`,
        userId: session.user?.id || '',
        taskId,
        projectId: (await prisma.task.findUnique({ where: { id: taskId } }))?.projectId,
      },
    });

    return NextResponse.json({ comment });
  } catch (error: any) {
    console.error('Error adding task comment:', error);
    return NextResponse.json(
      { error: 'Failed to add task comment', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[taskId]/comments?commentId=xxx - Delete a comment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { taskId: string } }
): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = params;
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    // Check permission
    const { hasPermission, error } = await checkTaskPermission(taskId, session, 'update');
    if (!hasPermission) {
      return NextResponse.json({ error }, { status: error === 'Task not found' ? 404 : 403 });
    }

    // Get the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if user is the comment author or has task management permission
    const isCommentAuthor = comment.userId === session.user?.id;
    const hasTaskManagementPermission = await PermissionService.hasPermissionById(
      session.user?.id || '',
      'task_management'
    );

    if (!isCommentAuthor && !hasTaskManagementPermission) {
      return NextResponse.json(
        { error: "You don't have permission to delete this comment" },
        { status: 403 }
      );
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { id: commentId },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'deleted',
        entityType: 'comment',
        entityId: commentId,
        description: `deleted a comment`,
        userId: session.user?.id || '',
        taskId,
        projectId: (await prisma.task.findUnique({ where: { id: taskId } }))?.projectId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting task comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete task comment', details: error.message },
      { status: 500 }
    );
  }
}
