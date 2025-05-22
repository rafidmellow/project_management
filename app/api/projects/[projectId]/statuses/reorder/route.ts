import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';

// POST: Reorder statuses
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        teamMembers: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Only project team members can reorder statuses
    if (project.teamMembers.length === 0 && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "You don't have permission to reorder statuses for this project" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validate request body
    const schema = z.object({
      statusId: z.string(),
      sourceIndex: z.number().int().min(0),
      destinationIndex: z.number().int().min(0),
    });

    const validationResult = schema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { statusId, sourceIndex, destinationIndex } = validationResult.data;

    // Check if status exists and belongs to the project
    const status = await prisma.projectStatus.findUnique({
      where: { id: statusId },
    });

    if (!status || status.projectId !== projectId) {
      return NextResponse.json({ error: 'Status not found' }, { status: 404 });
    }

    // Get all statuses for the project, ordered by their current order
    const statuses = await prisma.projectStatus.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });

    // Validate indices
    if (sourceIndex >= statuses.length || destinationIndex >= statuses.length) {
      return NextResponse.json({ error: 'Invalid source or destination index' }, { status: 400 });
    }

    // Reorder the statuses
    const newStatuses = [...statuses];
    const [movedStatus] = newStatuses.splice(sourceIndex, 1);
    newStatuses.splice(destinationIndex, 0, movedStatus);

    // Update the order of all statuses
    await Promise.all(
      newStatuses.map((status, index) =>
        prisma.projectStatus.update({
          where: { id: status.id },
          data: { order: index },
        })
      )
    );

    // Create activity record
    await prisma.activity.create({
      data: {
        action: 'reordered',
        entityType: 'project_status',
        entityId: statusId,
        description: `Status "${status.name}" was reordered`,
        userId: session.user.id,
        projectId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering project statuses:', error);
    return NextResponse.json(
      { error: 'An error occurred while reordering project statuses' },
      { status: 500 }
    );
  }
}
