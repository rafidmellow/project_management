import { NextRequest, NextResponse } from 'next/server';
import { Session } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withResourcePermission } from '@/lib/api-middleware';
import { projectPermissionCheck } from '@/lib/permissions/project-permissions';

// GET handler to fetch a specific project
export const GET = withResourcePermission(
  'projectId',
  projectPermissionCheck,
  async (req: NextRequest, context: any, session: Session, projectId: string) => {
    try {
      // Get the project with related data
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          teamMembers: {
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
          },
          statuses: true,
          _count: {
            select: {
              tasks: true,
              teamMembers: true,
            },
          },
        },
      });

      // Check if project exists
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      // Format dates for the response
      const formattedProject = {
        ...project,
        startDate: project.startDate?.toISOString() || null,
        endDate: project.endDate?.toISOString() || null,
        dueDate: project.dueDate?.toISOString() || null,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      };

      return NextResponse.json({ project: formattedProject });
    } catch (error) {
      console.error('Error fetching project:', error);
      return NextResponse.json(
        { error: 'An error occurred while fetching the project' },
        { status: 500 }
      );
    }
  },
  'view'
);

// Validation schema for updating a project
const updateProjectSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  estimatedTime: z.number().optional().nullable(),
  totalTimeSpent: z.number().optional().nullable(),
});

// PATCH handler to update a project
export const PATCH = withResourcePermission(
  'projectId',
  projectPermissionCheck,
  async (req: NextRequest, context: any, session: Session, projectId: string) => {
    try {
      const body = await req.json();

      // Validate request body
      const validationResult = updateProjectSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation error', details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const { title, description, startDate, endDate, dueDate, estimatedTime, totalTimeSpent } =
        validationResult.data;

      // Update the project
      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: {
          title,
          description,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          estimatedTime,
          totalTimeSpent,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          teamMembers: {
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
          },
          statuses: true,
          _count: {
            select: {
              tasks: true,
              teamMembers: true,
            },
          },
        },
      });

      // Format dates for the response
      const formattedProject = {
        ...updatedProject,
        startDate: updatedProject.startDate?.toISOString() || null,
        endDate: updatedProject.endDate?.toISOString() || null,
        dueDate: updatedProject.dueDate?.toISOString() || null,
        createdAt: updatedProject.createdAt.toISOString(),
        updatedAt: updatedProject.updatedAt.toISOString(),
      };

      return NextResponse.json({ project: formattedProject });
    } catch (error) {
      console.error('Error updating project:', error);
      return NextResponse.json(
        { error: 'An error occurred while updating the project' },
        { status: 500 }
      );
    }
  },
  'update'
);

// DELETE handler to delete a project
export const DELETE = withResourcePermission(
  'projectId',
  projectPermissionCheck,
  async (req: NextRequest, context: any, session: Session, projectId: string) => {
    try {
      // Delete the project (cascades to statuses, tasks, etc.)
      await prisma.project.delete({
        where: { id: projectId },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json(
        { error: 'An error occurred while deleting the project' },
        { status: 500 }
      );
    }
  },
  'delete'
);
