import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { unstable_cache } from 'next/cache';
import { PermissionService } from '@/lib/permissions/unified-permission-service';

// Cache dashboard stats for 1 minute per user
const getDashboardStats = unstable_cache(
  async (userId: string, userRole: string, userPermissions: string[]) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    let whereClause = {};

    // Different filtering based on user permissions
    const hasSystemSettings = userPermissions.includes('system_settings');
    const hasProjectManagement = userPermissions.includes('project_management');
    const hasViewAllProjects = userPermissions.includes('view_all_projects');

    if (hasSystemSettings || hasViewAllProjects) {
      // Users with system_settings or view_all_projects permission see all projects
      whereClause = {};
    } else if (hasProjectManagement) {
      // Users with project_management permission see projects they created or are a member of
      whereClause = {
        OR: [
          { createdById: userId }, // Projects they created
          {
            teamMembers: {
              some: {
                userId,
              },
            },
          },
        ],
      };
    } else {
      // Regular users only see projects they're a member of
      whereClause = {
        teamMembers: {
          some: {
            userId,
          },
        },
      };
    }

    // Get total projects count
    const totalProjects = await prisma.project.count({
      where: whereClause,
    });

    // Get projects with their task counts
    const recentProjects = await prisma.project.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            tasks: true,
            teamMembers: true,
          },
        },
        tasks: {
          select: {
            id: true,
            completed: true,
          },
        },
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
    });

    // Calculate project growth (comparing to last month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // For growth calculation, use the same filter as above
    const projectsLastMonth = await prisma.project.count({
      where: {
        ...whereClause,
        createdAt: {
          lt: new Date(),
        },
      },
    });

    const projectsThisMonth = await prisma.project.count({
      where: {
        ...whereClause,
        createdAt: {
          gte: lastMonth,
        },
      },
    });

    const growthRate =
      projectsLastMonth > 0
        ? ((projectsThisMonth - projectsLastMonth) / projectsLastMonth) * 100
        : 0;

    // Get system-wide stats for users with system_settings permission
    let systemStats = null;
    if (userPermissions.includes('system_settings')) {
      try {
        // Get total users count
        const totalUsers = await prisma.user.count();

        // Get users by role
        const adminCount = await prisma.user.count({ where: { role: 'admin' } });
        const managerCount = await prisma.user.count({ where: { role: 'manager' } });
        const userCount = await prisma.user.count({ where: { role: 'user' } });

        // Get total tasks across all projects
        const totalSystemTasks = await prisma.task.count();
        const completedSystemTasks = await prisma.task.count({ where: { completed: true } });

        systemStats = {
          totalUsers,
          usersByRole: {
            admin: adminCount,
            manager: managerCount,
            user: userCount,
          },
          totalTasks: totalSystemTasks,
          completedTasks: completedSystemTasks,
          completionRate:
            totalSystemTasks > 0 ? Math.round((completedSystemTasks / totalSystemTasks) * 100) : 0,
        };
      } catch (error) {
        console.error('Error fetching system stats:', error);
        // Provide fallback stats if there's an error
        systemStats = {
          totalUsers: 0,
          usersByRole: {
            admin: 0,
            manager: 0,
            user: 0,
          },
          totalTasks: 0,
          completedTasks: 0,
          completionRate: 0,
        };
      }
    }

    return {
      totalProjects,
      recentProjects: recentProjects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        createdBy: project.createdBy,
        teamCount: project._count.teamMembers,
        taskCount: project._count.tasks,
        completedTaskCount: project.tasks.filter(t => t.completed).length,
        progress:
          project._count.tasks > 0
            ? Math.round(
                (project.tasks.filter(t => t.completed).length / project._count.tasks) * 100
              )
            : 0,
        team: project.teamMembers.map(member => member.user),
      })),
      projectGrowth: Math.round(growthRate),
      systemStats, // Will be null for non-admin users
    };
  },
  ['dashboard-stats'],
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
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, role: true },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Get user permissions from the database
      const userPermissions = await PermissionService.getPermissionsForRole(user.role);

      // Get stats based on user role and permissions
      const stats = await getDashboardStats(userId, user.role, userPermissions);

      return NextResponse.json({ stats });
    } catch (dbError) {
      console.error('Database error in dashboard stats:', dbError);

      // Return a minimal response with empty stats to prevent UI from breaking
      return NextResponse.json(
        {
          stats: {
            totalProjects: 0,
            recentProjects: [],
            projectGrowth: 0,
            systemStats: null,
          },
          error: 'Database error occurred',
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
