import prisma from '@/lib/prisma';
import { ActivityLogParams, ActivityWithRelations } from '@/types/api';

/**
 * Log an activity to the database
 * @param params Activity log parameters
 * @returns The created activity log
 */
export async function logActivity(params: ActivityLogParams): Promise<any | null> {
  const { userId, action, entityType, entityId, description, projectId, taskId } = params;

  try {
    // Validate required parameters
    if (!userId || !action || !entityType || !entityId) {
      console.warn('Activity logging failed: Missing required parameters', { params });
      return null;
    }

    // Create the activity record
    const activity = await prisma.activity.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        description,
        projectId,
        taskId,
      },
    });

    return activity;
  } catch (error) {
    // Don't throw the error - logging should never break the main functionality
    console.error('Activity logging failed:', error, { params });
    return null;
  }
}

/**
 * Get recent activities for a user
 * @param userId User ID
 * @param limit Number of activities to return
 * @returns List of recent activities
 */
export async function getUserActivities(
  userId: string,
  limit = 10
): Promise<ActivityWithRelations[]> {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return activities;
  } catch (error) {
    console.error('Error fetching user activities:', error, { userId });
    return [];
  }
}

/**
 * Get recent activities for a project
 * @param projectId Project ID
 * @param limit Number of activities to return
 * @returns List of recent activities
 */
export async function getProjectActivities(
  projectId: string,
  limit = 20
): Promise<ActivityWithRelations[]> {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return activities;
  } catch (error) {
    console.error('Error fetching project activities:', error, { projectId });
    return [];
  }
}

/**
 * Get recent activities for a specific entity
 * @param entityType Entity type (e.g., 'Project', 'Task', 'TeamMember')
 * @param entityId Entity ID
 * @param limit Number of activities to return
 * @returns List of recent activities
 */
export async function getEntityActivities(
  entityType: string,
  entityId: string,
  limit = 10
): Promise<ActivityWithRelations[]> {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return activities;
  } catch (error) {
    console.error('Error fetching entity activities:', error, { entityType, entityId });
    return [];
  }
}
