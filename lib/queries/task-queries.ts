import { Prisma } from '@prisma/client';

/**
 * Standard select fields for user data
 */
export const userSelectFields = {
  id: true,
  name: true,
  email: true,
  image: true,
};

/**
 * Standard select fields for minimal user data
 */
export const userMinimalSelectFields = {
  id: true,
  name: true,
  image: true,
};

/**
 * Standard select fields for project data
 */
export const projectSelectFields = {
  id: true,
  title: true,
};

/**
 * Standard select fields for minimal project data
 */
export const projectMinimalSelectFields = {
  id: true,
  title: true,
};

// Type for task include with subtasks
type TaskIncludeWithSubtasks = Prisma.TaskInclude & {
  subtasks?: {
    orderBy: Prisma.Enumerable<Prisma.TaskOrderByWithRelationInput>;
    include: {
      assignedTo: { select: typeof userMinimalSelectFields };
      subtasks?: {
        orderBy: Prisma.Enumerable<Prisma.TaskOrderByWithRelationInput>;
        include: {
          assignedTo: { select: typeof userMinimalSelectFields };
          subtasks?: {
            orderBy: Prisma.Enumerable<Prisma.TaskOrderByWithRelationInput>;
            include: {
              assignedTo: { select: typeof userMinimalSelectFields };
            };
          };
        };
      };
    };
  };
};

/**
 * Get include object for task queries with configurable depth
 * @param depth The depth of subtasks to include (0-3)
 * @param includeActivities Whether to include activities
 * @param activitiesLimit Number of activities to include
 * @returns Prisma include object for task queries
 */
export function getTaskIncludeObject(
  depth: 0 | 1 | 2 | 3 = 1,
  includeActivities: boolean = false,
  activitiesLimit: number = 5
): TaskIncludeWithSubtasks {
  // Base include object
  const includeObj: TaskIncludeWithSubtasks = {
    project: {
      select: projectSelectFields,
    },
    // Use assignees as the primary way to get task assignees
    assignees: {
      include: {
        user: {
          select: userSelectFields,
        },
      },
    },
    parent: {
      select: {
        id: true,
        title: true,
      },
    },
    // Include comments and attachments
    comments: {
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: userSelectFields,
        },
      },
    },
    attachments: {
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: userSelectFields,
        },
      },
    },
  };

  // Add activities if requested
  if (includeActivities) {
    includeObj.activities = {
      orderBy: {
        createdAt: 'desc',
      },
      take: activitiesLimit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    };
  }

  // Add subtasks based on requested depth
  if (depth >= 1) {
    includeObj.subtasks = {
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        assignees: {
          include: {
            user: {
              select: userMinimalSelectFields,
            },
          },
        },
        assignedTo: { select: userMinimalSelectFields },
        status: { select: { name: true, color: true } },
      },
    };

    // Add second level of subtasks
    if (depth >= 2 && includeObj.subtasks?.include) {
      includeObj.subtasks.include.subtasks = {
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        include: {
          assignees: {
            include: {
              user: {
                select: userMinimalSelectFields,
              },
            },
          },
          assignedTo: { select: userMinimalSelectFields },
          status: { select: { name: true, color: true } },
        },
      };

      // Add third level of subtasks
      if (depth >= 3 && includeObj.subtasks.include.subtasks?.include) {
        includeObj.subtasks.include.subtasks.include.subtasks = {
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
          include: {
            assignees: {
              include: {
                user: {
                  select: userMinimalSelectFields,
                },
              },
            },
            assignedTo: { select: userMinimalSelectFields },
            status: { select: { name: true, color: true } },
          },
        };
      }
    }
  }

  return includeObj;
}

/**
 * Get a lighter include object for task list queries
 * @returns Prisma include object for task list queries
 */
export function getTaskListIncludeObject(): Prisma.TaskInclude {
  return {
    status: {
      select: {
        name: true,
        color: true,
      },
    },
    project: {
      select: projectMinimalSelectFields,
    },
    // Use assignees as the primary way to get task assignees
    assignees: {
      include: {
        user: {
          select: userMinimalSelectFields,
        },
      },
    },
    subtasks: {
      select: {
        id: true,
      },
    },
  };
  // Note: Fields like dueDate, priority, etc. are automatically included from the Task model
  // and don't need to be explicitly specified in the include object
}

/**
 * Standard order by for task queries
 */
export const taskOrderBy: Prisma.TaskOrderByWithRelationInput[] = [
  { priority: 'desc' },
  { order: 'asc' },
  { dueDate: 'asc' },
  { updatedAt: 'desc' },
];

/**
 * Get a task by ID with configurable include depth
 * @param id Task ID
 * @param depth Depth of subtasks to include
 * @param includeActivities Whether to include activities
 * @returns Promise resolving to the task
 */
export function getTaskIncludeConfig(
  depth: 0 | 1 | 2 | 3 = 1,
  includeActivities: boolean = false
): Prisma.TaskInclude {
  return getTaskIncludeObject(depth, includeActivities);
}
