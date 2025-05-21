import prisma from '../prisma';
import { Prisma, User } from '@prisma/client';
import { hash } from 'bcrypt';
import { getTaskListIncludeObject } from './task-queries'; // Assuming this is correctly imported
import { CreateUserDTO, UpdateUserDTO } from '@/types/user';

// Re-export types from types/user.ts for backward compatibility
export type UserCreateInput = CreateUserDTO;
export type UserUpdateInput = UpdateUserDTO;

// Get all users with optional filters and pagination
export async function getUsers(
  args: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    where?: Prisma.UserWhereInput;
    includeProjects?: boolean;
    includeTasks?: boolean;
    includeTeams?: boolean;
    includeCounts?: boolean; // New option to include role counts
  } = {}
) {
  const {
    skip = 0,
    take = 50,
    orderBy = { createdAt: 'desc' },
    where = {},
    includeProjects = false,
    includeTasks = false,
    includeTeams = false,
    includeCounts = false,
  } = args;

  const select: Prisma.UserSelect = {
    id: true,
    name: true,
    email: true,
    image: true,
    role: true,
    createdAt: true,
    updatedAt: true,
    emailVerified: true,
    lastLogin: true,
    // Never return the password
    password: false,
  };

  // Conditionally include relations
  if (includeProjects) {
    select.teams = {
      select: {
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      take: 5,
    };
  }

  if (includeTasks) {
    select.taskAssignments = {
      select: {
        task: {
          select: {
            id: true,
            title: true,
            description: true,
            priority: true,
            dueDate: true,
            completed: true,
            project: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      take: 5,
    };
  }

  // Include team memberships if requested
  if (includeTeams) {
    select.teams = {
      select: {
        id: true,
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        createdAt: true,
      },
      take: 5,
    };
  }

  // Get total count of users matching the where clause
  const totalCount = await prisma.user.count({ where });

  // Get users with pagination
  const users = await prisma.user.findMany({
    skip,
    take,
    where,
    orderBy,
    select,
  });

  // Get role counts if requested
  let roleCounts = {};
  if (includeCounts) {
    // Count users by role
    const adminCount = await prisma.user.count({
      where: { ...where, role: 'admin' },
    });

    const managerCount = await prisma.user.count({
      where: { ...where, role: 'manager' },
    });

    const userCount = await prisma.user.count({
      where: { ...where, role: 'user' },
    });

    roleCounts = {
      admin: adminCount,
      manager: managerCount,
      user: userCount,
    };
  }

  return {
    users,
    pagination: {
      totalCount,
      skip,
      take,
    },
    ...(includeCounts ? { counts: roleCounts } : {}),
  };
}

// Get user by ID with option to include relations
export async function getUserById(id: string, includeRelations: boolean = false) {
  const select: Prisma.UserSelect = {
    id: true,
    name: true,
    email: true,
    image: true,
    role: true,
    bio: true,
    jobTitle: true,
    department: true,
    location: true,
    phone: true,
    skills: true,
    createdAt: true,
    updatedAt: true,
    emailVerified: true,
    lastLogin: true, // Include lastLogin field
    // Never return the password
    password: false,
  };

  if (includeRelations) {
    select.projects = {
      select: {
        id: true,
        title: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    };
    // Get tasks directly assigned to the user (via assignedToId)
    select.tasks = {
      select: {
        id: true,
        title: true,
        priority: true,
        dueDate: true,
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    };

    // Get tasks assigned via TaskAssignee table (multiple assignees)
    select.taskAssignments = {
      select: {
        id: true,
        task: {
          select: {
            id: true,
            title: true,
            priority: true,
            dueDate: true,
            project: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    };
    select.activities = {
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        action: true,
        entityType: true,
        description: true,
        createdAt: true,
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
    };
  }

  return prisma.user.findUnique({
    where: { id },
    select,
  });
}

// Get user profile with stats
export async function getUserProfile(id: string) {
  const user = await getUserById(id, true);

  if (!user) {
    return null;
  }

  // Add profile fields if they don't exist
  const profileFields = {
    bio: user.bio || null,
    jobTitle: user.jobTitle || null,
    department: user.department || null,
    location: user.location || null,
    phone: user.phone || null,
    skills: user.skills || null,
  };

  // Get last login directly from user model
  // We'll keep this as a fallback in case the user model doesn't have lastLogin
  let lastLogin = user.lastLogin;

  if (!lastLogin) {
    // Fallback to attendance records if user lastLogin is not set
    const lastAttendance = await prisma.attendance.findFirst({
      where: { userId: id },
      orderBy: { checkInTime: 'desc' },
      select: { checkInTime: true },
    });

    if (lastAttendance) {
      lastLogin = lastAttendance.checkInTime;
    }
  }

  // Calculate user stats
  const stats = await getUserStats(id);

  // Combine tasks from both direct assignments and TaskAssignee table
  const allTasks = [...(user.tasks || [])];

  // Add tasks from taskAssignments if they exist
  if (user.taskAssignments && Array.isArray(user.taskAssignments)) {
    const tasksFromAssignments = user.taskAssignments
      .filter(assignment => assignment.task) // Filter out any null tasks
      .map(assignment => assignment.task);

    // Add tasks that aren't already in the allTasks array
    for (const task of tasksFromAssignments) {
      if (!allTasks.some(t => t.id === task.id)) {
        allTasks.push(task);
      }
    }
  }

  // Get all projects the user is a member of via TeamMember table
  const teamProjects = await prisma.project.findMany({
    where: {
      teamMembers: {
        some: {
          userId: id,
        },
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      startDate: true,
      endDate: true,
      createdAt: true,
    },
  });

  // Combine with any projects already in the user object
  const allProjects = [...(user.projects || []), ...teamProjects];

  // Remove duplicates by project ID
  const uniqueProjects = allProjects.filter(
    (project, index, self) => index === self.findIndex(p => p.id === project.id)
  );

  return {
    ...user,
    ...profileFields,
    tasks: allTasks,
    projects: uniqueProjects,
    stats,
    lastLogin: lastLogin || null,
  };
}

// Calculate user statistics
export async function getUserStats(userId: string) {
  // Get project count
  const projectCount = await prisma.project.count({
    where: {
      teamMembers: {
        some: {
          userId,
        },
      },
    },
  });

  // Get task count (both direct assignments and via TaskAssignee table)
  const directTaskCount = await prisma.task.count({
    where: {
      assignedToId: userId,
    },
  });

  const taskAssigneeCount = await prisma.taskAssignee.count({
    where: {
      userId,
    },
  });

  const taskCount = directTaskCount + taskAssigneeCount;

  // Get team count (unique projects user is part of)
  const teamCount = await prisma.teamMember.count({
    where: {
      userId,
    },
  });

  // Calculate completion rate
  // We'll use the taskCount we already calculated above
  const totalTasks = taskCount;

  // Since we no longer have a status field, we'll use a placeholder value for now
  // In a real implementation, you might want to add a 'completed' boolean field to the Task model
  const completedTasks = 0;

  const completionRate =
    totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '0%';

  return {
    projectCount,
    taskCount,
    teamCount,
    completionRate,
  };
}

// Create a new user
export async function createUser(data: UserCreateInput) {
  const { password, ...userData } = data;

  // Hash password if provided
  const userToCreate: Prisma.UserCreateInput = {
    ...userData,
  };

  if (password) {
    userToCreate.password = await hash(password, 10);
  }

  const user = await prisma.user.create({
    data: userToCreate,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
}

// Update user details
export async function updateUser(id: string, data: UserUpdateInput) {
  const { password, ...userData } = data;

  // Create update object
  const userToUpdate: Prisma.UserUpdateInput = {
    ...userData,
  };

  // Hash password if provided
  if (password) {
    userToUpdate.password = await hash(password, 10);
  }

  console.log('Updating user with data:', userToUpdate);

  const user = await prisma.user.update({
    where: { id },
    data: userToUpdate,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      bio: true,
      jobTitle: true,
      department: true,
      location: true,
      phone: true,
      skills: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

// Delete a user
export async function deleteUser(id: string) {
  return prisma.user.delete({
    where: { id },
  });
}

// Update user profile image
export async function updateUserImage(id: string, imageUrl: string) {
  return prisma.user.update({
    where: { id },
    data: {
      image: imageUrl,
    },
    select: {
      id: true,
      image: true,
    },
  });
}

// Log user activity
export async function logUserActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  description?: string,
  projectId?: string,
  taskId?: string
) {
  return prisma.activity.create({
    data: {
      action,
      entityType,
      entityId,
      description,
      userId,
      projectId,
      taskId,
    },
  });
}

export async function getUserProfileData(userId: string) {
  // ... (existing code to fetch user)

  // Fetch projects the user is a member of or created
  const projects = await prisma.project.findMany({
    where: {
      OR: [{ createdById: userId }, { teamMembers: { some: { userId: userId } } }],
    },
    select: {
      id: true,
      title: true,
      // status: true, // Assuming project status needs separate handling if needed
      startDate: true,
      endDate: true,
      teamMembers: {
        where: { userId: userId },
        select: {
          // Need to select fields that indicate the role, e.g., if TeamMember has a 'role' field
          createdAt: true, // Placeholder, adjust based on actual TeamMember fields
        },
      },
    },
  });

  // Map projects to include user's role (example assumes TeamMember has role)
  const mappedProjects = projects.map(p => ({
    id: p.id,
    title: p.title,
    // status: p.status, // Adjust as needed
    startDate: p.startDate?.toISOString() ?? null,
    endDate: p.endDate?.toISOString() ?? null,
    role: p.teamMembers[0] ? 'Member' : 'Creator', // Example role logic
    joinedAt: p.teamMembers[0]?.createdAt.toISOString() ?? new Date().toISOString(), // Example join date
  }));

  // Fetch tasks assigned to the user via TaskAssignee
  const tasks = await prisma.task.findMany({
    where: {
      assignees: {
        // Filter using the assignees relation
        some: {
          userId: userId,
        },
      },
      // Remove old filter:
      // assignedToId: userId
    },
    include: getTaskListIncludeObject(), // Use the standard include for lists
    orderBy: { createdAt: 'desc' },
    take: 100, // Example limit
  });

  // ... (rest of the function, including stats calculation)
}
