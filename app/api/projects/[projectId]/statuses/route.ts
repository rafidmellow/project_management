import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';
import { ApiRouteHandlerOneParam, getParams } from '@/lib/api-route-types';

// GET: Fetch all statuses for a project
export const GET: ApiRouteHandlerOneParam<'projectId'> = async (_req, { params }) => {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = await getParams(params).then(p => p.projectId);

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

    // Get all statuses for the project, ordered by their order field
    const statuses = await prisma.projectStatus.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ statuses });
  } catch (error) {
    console.error('Error fetching project statuses:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching project statuses' },
      { status: 500 }
    );
  }
};

// POST: Create a new status for a project
export const POST: ApiRouteHandlerOneParam<'projectId'> = async (req, { params }) => {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = await getParams(params).then(p => p.projectId);

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

    // Only project team members can create statuses
    if (project.teamMembers.length === 0 && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "You don't have permission to create statuses for this project" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validate request body
    const schema = z.object({
      name: z.string().min(1).max(50),
      color: z.string().optional(),
      description: z.string().optional(),
      isDefault: z.boolean().optional(),
    });

    const validationResult = schema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { name, color, description, isDefault } = validationResult.data;

    // Check if a status with the same name already exists for this project
    // Using a simpler approach for case-insensitive comparison
    const existingStatus = await prisma.projectStatus.findFirst({
      where: {
        projectId,
        name: {
          equals: name,
        },
      },
    });

    if (existingStatus) {
      return NextResponse.json(
        { error: 'A status with this name already exists for this project' },
        { status: 400 }
      );
    }

    // Get the highest order value to place the new status at the end
    const highestOrder = await prisma.projectStatus.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const newOrder = (highestOrder?.order || 0) + 1;

    // If this is the first status or isDefault is true, make it the default
    const shouldBeDefault =
      isDefault ||
      !(await prisma.projectStatus.findFirst({
        where: { projectId, isDefault: true },
      }));

    // If making this status default, unset default on other statuses
    if (shouldBeDefault) {
      await prisma.projectStatus.updateMany({
        where: { projectId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create the new status
    const status = await prisma.projectStatus.create({
      data: {
        name,
        color: color || '#6E56CF', // Default color if not provided
        description,
        order: newOrder,
        isDefault: shouldBeDefault,
        projectId,
      },
    });

    // Create activity record
    await prisma.activity.create({
      data: {
        action: 'created',
        entityType: 'project_status',
        entityId: status.id,
        description: `Status "${name}" was created for project`,
        userId: session.user.id,
        projectId,
      },
    });

    return NextResponse.json({ status }, { status: 201 });
  } catch (error) {
    console.error('Error creating project status:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the project status' },
      { status: 500 }
    );
  }
};
