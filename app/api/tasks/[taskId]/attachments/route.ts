import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';
import { checkTaskPermission } from '@/lib/permissions/task-permissions';
import { PermissionService } from '@/lib/permissions/unified-permission-service';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync } from 'fs';

// GET /api/tasks/[taskId]/attachments - Get attachments for a task
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
): Promise<Response> {
  const { taskId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Check permission
    const { hasPermission, error } = await checkTaskPermission(taskId, session, 'view');
    if (!hasPermission) {
      return NextResponse.json({ error }, { status: error === 'Task not found' ? 404 : 403 });
    }

    // Get attachments for the task
    const attachments = await prisma.taskAttachment.findMany({
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

    return NextResponse.json({ attachments });
  } catch (error: any) {
    console.error('Error fetching task attachments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task attachments', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[taskId]/attachments - Upload an attachment to a task
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
): Promise<Response> {
  const { taskId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Check permission
    const { hasPermission, error } = await checkTaskPermission(taskId, session, 'update');
    if (!hasPermission) {
      return NextResponse.json({ error }, { status: error === 'Task not found' ? 404 : 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Get file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique filename with the original extension
    const originalName = file.name;
    const extension = originalName.split('.').pop() || '';
    const filename = `${uuidv4()}.${extension}`;

    // Create directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public/uploads/task-attachments');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file to disk
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Create attachment record in database
    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId,
        userId: session.user.id,
        filename: originalName,
        fileUrl: `/uploads/task-attachments/${filename}`,
        fileSize: file.size,
        fileType: file.type,
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
        action: 'uploaded',
        entityType: 'attachment',
        entityId: attachment.id,
        description: `uploaded attachment "${originalName}"`,
        userId: session.user.id,
        taskId,
        projectId: (await prisma.task.findUnique({ where: { id: taskId } }))?.projectId,
      },
    });

    return NextResponse.json({ attachment });
  } catch (error: any) {
    console.error('Error uploading task attachment:', error);
    return NextResponse.json(
      { error: 'Failed to upload task attachment', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[taskId]/attachments?attachmentId=xxx - Delete an attachment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
): Promise<Response> {
  const { taskId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get('attachmentId');

    if (!attachmentId) {
      return NextResponse.json({ error: 'Attachment ID is required' }, { status: 400 });
    }

    // Check permission
    const { hasPermission, error } = await checkTaskPermission(taskId, session, 'update');
    if (!hasPermission) {
      return NextResponse.json({ error }, { status: error === 'Task not found' ? 404 : 403 });
    }

    // Get the attachment
    const attachment = await prisma.taskAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Check if user is the attachment uploader or has task management permission
    const isAttachmentUploader = attachment.userId === session.user.id;
    const hasTaskManagementPermission = await PermissionService.hasPermissionById(
      session.user.id,
      'task_management'
    );

    if (!isAttachmentUploader && !hasTaskManagementPermission) {
      return NextResponse.json(
        { error: "You don't have permission to delete this attachment" },
        { status: 403 }
      );
    }

    // Delete the attachment record
    await prisma.taskAttachment.delete({
      where: { id: attachmentId },
    });

    // Note: We're not deleting the actual file to avoid file system operations
    // In a production environment, you would delete the file from storage

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'deleted',
        entityType: 'attachment',
        entityId: attachmentId,
        description: `deleted attachment "${attachment.filename}"`,
        userId: session.user.id,
        taskId,
        projectId: (await prisma.task.findUnique({ where: { id: taskId } }))?.projectId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting task attachment:', error);
    return NextResponse.json(
      { error: 'Failed to delete task attachment', details: error.message },
      { status: 500 }
    );
  }
}
