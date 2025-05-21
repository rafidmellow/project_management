import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';

/**
 * GET /api/projects/all/statuses
 * This is a special route to handle the case when projectId is "all"
 * It redirects to the /api/project-statuses endpoint
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all statuses from all projects the user has access to
    const userProjects = await prisma.project.findMany({
      where: {
        OR: [
          { createdById: session.user.id },
          {
            teamMembers: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    const projectIds = userProjects.map(project => project.id);

    // Get all statuses for these projects
    const statuses = await prisma.projectStatus.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
      },
      orderBy: [{ projectId: 'asc' }, { order: 'asc' }],
    });

    // Group statuses by project for better organization
    const statusesByProject = statuses.reduce(
      (acc, status) => {
        if (!acc[status.projectId]) {
          acc[status.projectId] = [];
        }
        acc[status.projectId].push(status);
        return acc;
      },
      {} as Record<string, typeof statuses>
    );

    // Get unique statuses based on name (prioritizing default statuses)
    const uniqueStatuses = Object.values(statusesByProject)
      .flat()
      .sort((a, b) => {
        // Sort by isDefault (true first), then by order
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return a.order - b.order;
      })
      .filter((status, index, self) => {
        // Keep only the first occurrence of each status name
        return index === self.findIndex(s => s.name === status.name);
      });

    return NextResponse.json({ statuses: uniqueStatuses });
  } catch (error) {
    console.error('Error fetching all project statuses:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching project statuses' },
      { status: 500 }
    );
  }
}
