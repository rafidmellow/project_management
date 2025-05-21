import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { unstable_cache } from 'next/cache';

// Cache user tasks for 1 minute
const getUserTasks = unstable_cache(
  async (userId: string) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get projects the user is a member of
    const userProjects = await prisma.project.findMany({
      where: {
        teamMembers: {
          some: {
            userId,
          },
        },
      },
      select: {
        id: true,
        title: true,
      },
    });

    const projectIds = userProjects.map(project => project.id);

    // Get tasks from those projects that are assigned to the user
    const assignedTasks = await prisma.task.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
        assignees: {
          some: {
            userId,
          },
        },
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        status: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Transform tasks to match the expected format
    return assignedTasks.map(task => ({
      id: task.id,
      title: task.title,
      projectId: task.projectId,
      projectTitle: task.project.title,
      completed: task.completed,
      dueDate: task.dueDate?.toISOString() || null,
      priority: task.priority,
      status: task.status
        ? {
            id: task.status.id,
            name: task.status.name,
            color: task.status.color,
          }
        : null,
    }));
  },
  ['user-tasks'],
  { revalidate: 60 } // Cache for 1 minute
);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    try {
      // Get tasks for the user
      const tasks = await getUserTasks(userId);

      return NextResponse.json({ tasks });
    } catch (dbError) {
      console.error('Database error in user tasks:', dbError);

      // Return a minimal response with empty tasks to prevent UI from breaking
      return NextResponse.json(
        {
          tasks: [],
          error: 'Database error occurred',
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('User tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch user tasks' }, { status: 500 });
  }
}
