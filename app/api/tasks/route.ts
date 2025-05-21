import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api-middleware';
import { checkProjectPermission } from '@/lib/permissions/project-permissions';
import { checkTaskPermission } from '@/lib/permissions/task-permissions';
import { getTaskListIncludeObject, taskOrderBy } from '@/lib/queries/task-queries';
import { getNextOrderValue } from '@/lib/ordering/task-ordering';
import { createTaskSchema, CreateTaskValues } from '@/lib/validations/task';

// GET handler to list tasks
export const GET = withAuth(async (req: NextRequest, _, session) => {
  try {
    // Get search params
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const assigneeId = searchParams.get('assigneeId');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build filter
    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (assigneeId) {
      // Use the TaskAssignee relation for filtering
      where.assignees = {
        some: {
          userId: assigneeId,
        },
      };
    }

    if (priority) {
      where.priority = priority;
    }

    // Get total count
    const total = await prisma.task.count({ where });

    // Only get top-level tasks (no parentId) unless specifically requested
    if (!searchParams.has('includeSubtasks') && !searchParams.has('parentId')) {
      where.parentId = null;
    }

    // If parentId is specified, get subtasks of that parent
    const parentId = searchParams.get('parentId');
    if (parentId) {
      where.parentId = parentId;
    }

    // Get tasks with pagination - use optimized include for list view
    const tasks = await prisma.task.findMany({
      where,
      include: getTaskListIncludeObject(),
      orderBy: taskOrderBy,
      take: limit,
      skip: skip,
    });

    return NextResponse.json({
      tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'An error occurred while fetching tasks' }, { status: 500 });
  }
}, 'view_projects');

// Validation schema for creating a task
// export const createTaskSchema = z.object({ ... }); // Remove schema definition
// export type CreateTaskValues = z.infer<typeof createTaskSchema>; // Remove type definition

// POST handler to create a task
export const POST = withAuth(async (req: NextRequest, _, session) => {
  try {
    const body = await req.json();

    // Validate request body
    const validationResult = createTaskSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      priority,
      startDate,
      endDate,
      dueDate,
      estimatedTime,
      timeSpent,
      projectId,
      statusId,
      assigneeIds,
      parentId,
    } = validationResult.data;
    console.log('POST /api/tasks: Parsed data:', { title, projectId, assigneeIds });

    // Check project permission
    const { hasPermission, error } = await checkProjectPermission(projectId, session, 'update');

    if (!hasPermission) {
      return NextResponse.json({ error }, { status: error === 'Project not found' ? 404 : 403 });
    }

    // Validate assigneeIds if provided
    if (assigneeIds && assigneeIds.length > 0) {
      const userCount = await prisma.user.count({
        where: {
          id: {
            in: assigneeIds,
          },
        },
      });

      if (userCount !== assigneeIds.length) {
        return NextResponse.json(
          { error: 'One or more users in assigneeIds not found' },
          { status: 400 }
        );
      }
    }

    // If this is a subtask, verify parent task exists and belongs to the same project
    if (parentId) {
      // Check parent task permission
      const parentResult = await checkTaskPermission(parentId, session, 'update');

      if (!parentResult.hasPermission) {
        return NextResponse.json(
          { error: parentResult.error },
          { status: parentResult.error === 'Task not found' ? 404 : 403 }
        );
      }

      // Verify parent task belongs to the same project
      if (parentResult.task.projectId !== projectId) {
        return NextResponse.json(
          { error: 'Subtask must belong to the same project as parent task' },
          { status: 400 }
        );
      }
    }

    // Get the next order value for the new task
    const initialOrder = await getNextOrderValue(projectId, parentId || null);

    // Ensure the current user is a team member of the project
    const isTeamMember = await prisma.teamMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: session.user.id,
        },
      },
    });

    if (!isTeamMember) {
      // Add the user as a team member if they're not already
      await prisma.teamMember.create({
        data: {
          userId: session.user.id,
          projectId,
        },
      });
    }

    // If no status is provided, find the default status for the project
    let finalStatusId = statusId;
    if (!finalStatusId) {
      const defaultStatus = await prisma.projectStatus.findFirst({
        where: {
          projectId,
          isDefault: true,
        },
      });

      if (defaultStatus) {
        finalStatusId = defaultStatus.id;
      }
    }

    // Log date fields for debugging
    console.log('Creating task with date fields:', { startDate, endDate, dueDate });

    // Create task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedTime,
        timeSpent,
        projectId,
        statusId: finalStatusId,
        parentId,
        order: initialOrder,
      },
      include: {
        project: true,
        status: true,
        parent: {
          select: {
            id: true,
            title: true,
            priority: true,
            projectId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        assignees: {
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
      },
    });

    // Now create the activity with the task's ID as entityId
    try {
      // First, verify that the user exists in the database
      const userExists = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true },
      });

      if (userExists) {
        await prisma.activity.create({
          data: {
            action: 'created',
            entityType: parentId ? 'subtask' : 'task',
            entityId: task.id, // Now we have the task ID
            description: parentId
              ? `Subtask "${title}" was created under task ID ${parentId}`
              : `Task "${title}" was created`,
            userId: session.user.id,
            projectId,
            taskId: task.id, // Link to the task
          },
        });
      } else {
        console.warn(`Activity not created: User ID ${session.user.id} not found in database`);
      }
    } catch (activityError) {
      // Log the error but don't fail the task creation
      console.error('Error creating activity:', activityError);
    }

    // Create task assignees
    try {
      // Prepare the list of assignees
      let allAssigneeIds = assigneeIds && assigneeIds.length > 0 ? [...assigneeIds] : [];

      // Add the current user as an assignee if they're not already in the list
      if (!allAssigneeIds.includes(session.user.id)) {
        allAssigneeIds.push(session.user.id);
      }

      // Validate that all assigneeIds refer to existing users
      if (allAssigneeIds.length > 0) {
        const userCount = await prisma.user.count({
          where: {
            id: {
              in: allAssigneeIds,
            },
          },
        });

        if (userCount !== allAssigneeIds.length) {
          console.warn(
            'One or more users in assigneeIds not found. Proceeding with valid users only.'
          );
          // Get the valid user IDs
          const validUsers = await prisma.user.findMany({
            where: {
              id: {
                in: allAssigneeIds,
              },
            },
            select: { id: true },
          });
          allAssigneeIds = validUsers.map(user => user.id);
        }
      }

      // Create task assignees and add them as team members of the project
      if (allAssigneeIds.length > 0) {
        // Create all task assignees in a single transaction
        await prisma.$transaction(
          allAssigneeIds.map(userId =>
            prisma.taskAssignee.create({
              data: {
                taskId: task.id,
                userId,
              },
            })
          )
        );

        // Add users as team members if needed
        await Promise.all(
          allAssigneeIds.map(async userId => {
            // Check if user is already a team member of the project
            const existingTeamMember = await prisma.teamMember.findUnique({
              where: {
                projectId_userId: {
                  projectId,
                  userId,
                },
              },
            });

            // If not, add them as a team member
            if (!existingTeamMember) {
              await prisma.teamMember.create({
                data: {
                  userId,
                  projectId,
                },
              });
              console.log(
                `Added user ${userId} as team member to project ${projectId} during task creation`
              );
            }
          })
        );

        // Fetch the task with assignees to get the complete data
        const updatedTask = await prisma.task.findUnique({
          where: { id: task.id },
          include: {
            assignees: {
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
          },
        });

        if (updatedTask && 'assignees' in updatedTask && updatedTask.assignees) {
          // Use type assertion to handle the dynamic property
          (task as any).assignees = updatedTask.assignees;
        }
      }
    } catch (error) {
      console.error('Error creating task assignees:', error);
      // Don't fail the task creation if assignee creation fails
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace available'
    );

    // Provide more detailed error information
    let errorMessage = 'An error occurred while creating the task';
    let errorDetails: any = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        stack: error.stack,
        name: error.name,
      };

      // Check for Prisma-specific errors
      if (error.message.includes('Unknown field `parentId`')) {
        errorMessage = 'Database schema mismatch: parentId field is missing';
        errorDetails = {
          ...errorDetails,
          hint: "The Prisma client needs to be regenerated. Run 'npx prisma generate' to update it.",
        };
      } else if (error.message.includes('foreign key constraint')) {
        // Add specific handling for foreign key errors
        if (error.message.includes('User')) {
          errorMessage = 'Invalid user reference: The specified user does not exist';
        } else if (error.message.includes('Project')) {
          errorMessage = 'Invalid project reference: The specified project does not exist';
        } else {
          errorMessage = 'A database constraint error occurred';
        }
        errorDetails.constraint = 'foreign key';
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}, 'task_creation');
