import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';
import { ApiRouteHandlerTwoParams, getParams } from '@/lib/api-route-types';

// GET: Fetch a specific status
export const GET: ApiRouteHandlerTwoParams<'projectId', 'statusId'> = async (req, { params }) => {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract params safely
    const resolvedParams = await getParams(params);
    const { projectId, statusId } = resolvedParams;

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

    // Get the status
    const status = await prisma.projectStatus.findUnique({
      where: { id: statusId },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!status || status.projectId !== projectId) {
      return NextResponse.json({ error: 'Status not found' }, { status: 404 });
    }

    return NextResponse.json({ status });
  } catch (error) {
    console.error('Error fetching project status:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the project status' },
      { status: 500 }
    );
  }
};

// PATCH: Update a status
export const PATCH: ApiRouteHandlerTwoParams<'projectId', 'statusId'> = async (req, { params }) => {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract params safely
    const resolvedParams = await getParams(params);
    const { projectId, statusId } = resolvedParams;

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

    // Only project team members can update statuses
    if (project.teamMembers.length === 0 && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "You don't have permission to update statuses for this project" },
        { status: 403 }
      );
    }

    // Check if status exists and belongs to the project
    const existingStatus = await prisma.projectStatus.findUnique({
      where: { id: statusId },
    });

    if (!existingStatus || existingStatus.projectId !== projectId) {
      return NextResponse.json({ error: 'Status not found' }, { status: 404 });
    }

    const body = await req.json();

    // Validate request body
    const schema = z.object({
      name: z.string().min(1).max(50).optional(),
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

    // If name is being updated, check for duplicates
    if (name && name !== existingStatus.name) {
      const duplicateStatus = await prisma.projectStatus.findFirst({
        where: {
          projectId,
          id: { not: statusId },
          name: {
            equals: name,
          },
        },
      });

      if (duplicateStatus) {
        return NextResponse.json(
          { error: 'A status with this name already exists for this project' },
          { status: 400 }
        );
      }
    }

    // If making this status default, unset default on other statuses
    if (isDefault && !existingStatus.isDefault) {
      await prisma.projectStatus.updateMany({
        where: { projectId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Update the status
    const updatedStatus = await prisma.projectStatus.update({
      where: { id: statusId },
      data: {
        name: name !== undefined ? name : undefined,
        color: color !== undefined ? color : undefined,
        description: description !== undefined ? description : undefined,
        isDefault: isDefault !== undefined ? isDefault : undefined,
      },
    });

    // Create activity record
    await prisma.activity.create({
      data: {
        action: 'updated',
        entityType: 'project_status',
        entityId: statusId,
        description: `Status "${updatedStatus.name}" was updated`,
        userId: session.user.id,
        projectId,
      },
    });

    return NextResponse.json({ status: updatedStatus });
  } catch (error) {
    console.error('Error updating project status:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the project status' },
      { status: 500 }
    );
  }
};

// DELETE: Delete a status
export const DELETE: ApiRouteHandlerTwoParams<'projectId', 'statusId'> = async (
  req,
  { params }
) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract params safely
    const resolvedParams = await getParams(params);
    const { projectId, statusId } = resolvedParams;

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

    // Only project team members can delete statuses
    if (project.teamMembers.length === 0 && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "You don't have permission to delete statuses for this project" },
        { status: 403 }
      );
    }

    // Check if status exists and belongs to the project
    const existingStatus = await prisma.projectStatus.findUnique({
      where: { id: statusId },
      include: {
        tasks: {
          select: { id: true },
        },
      },
    });

    if (!existingStatus || existingStatus.projectId !== projectId) {
      return NextResponse.json({ error: 'Status not found' }, { status: 404 });
    }

    // Cannot delete the default status if it's the only status
    if (existingStatus.isDefault) {
      const statusCount = await prisma.projectStatus.count({
        where: { projectId },
      });

      if (statusCount === 1) {
        return NextResponse.json(
          { error: 'Cannot delete the only status in the project' },
          { status: 400 }
        );
      }
    }

    // Find another status to move tasks to if this status has tasks
    let targetStatusId: string | null = null;

    if (existingStatus.tasks.length > 0) {
      // Try to find the default status (that's not this one)
      const defaultStatus = await prisma.projectStatus.findFirst({
        where: {
          projectId,
          id: { not: statusId },
          isDefault: true,
        },
      });

      if (defaultStatus) {
        targetStatusId = defaultStatus.id;
      } else {
        // Otherwise, just get any other status
        const anyStatus = await prisma.projectStatus.findFirst({
          where: {
            projectId,
            id: { not: statusId },
          },
        });

        if (anyStatus) {
          targetStatusId = anyStatus.id;
        } else {
          return NextResponse.json(
            { error: "Cannot delete the status because there's no other status to move tasks to" },
            { status: 400 }
          );
        }
      }

      // Move all tasks to the target status
      await prisma.task.updateMany({
        where: { statusId },
        data: { statusId: targetStatusId },
      });
    }

    // If this was the default status, make another status the default
    if (existingStatus.isDefault) {
      const newDefaultStatus = await prisma.projectStatus.findFirst({
        where: {
          projectId,
          id: { not: statusId },
        },
      });

      if (newDefaultStatus) {
        await prisma.projectStatus.update({
          where: { id: newDefaultStatus.id },
          data: { isDefault: true },
        });
      }
    }

    // Delete the status
    await prisma.projectStatus.delete({
      where: { id: statusId },
    });

    // Create activity record
    await prisma.activity.create({
      data: {
        action: 'deleted',
        entityType: 'project_status',
        entityId: statusId,
        description: `Status "${existingStatus.name}" was deleted${
          targetStatusId ? ' and tasks were moved to another status' : ''
        }`,
        userId: session.user.id,
        projectId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project status:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting the project status' },
      { status: 500 }
    );
  }
};
