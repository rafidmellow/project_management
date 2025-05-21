import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';

// GET handler to list projects
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get URL parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const statusParam = url.searchParams.get('status');
    const statusIdParam = url.searchParams.get('statusId');
    const titleParam = url.searchParams.get('title');
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');
    const teamMemberIdsParam = url.searchParams.get('teamMemberIds');
    const sortFieldParam = url.searchParams.get('sortField') || 'updatedAt';
    const sortDirectionParam = url.searchParams.get('sortDirection') || 'desc';

    const skip = (page - 1) * limit;

    // Validate pagination parameters
    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    // Validate sort parameters
    const validSortFields = ['title', 'startDate', 'endDate', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortFieldParam) ? sortFieldParam : 'updatedAt';
    const sortDirection = sortDirectionParam === 'asc' ? 'asc' : 'desc';

    const where: any = {};

    // Add status filter if provided
    if (statusIdParam) {
      where.statusId = statusIdParam;
    } else if (statusParam) {
      // For backward compatibility, try to find status by name
      const status = await prisma.projectStatus.findFirst({
        where: {
          name: {
            equals: statusParam,
          },
        },
      });

      if (status) {
        where.statusId = status.id;
      }
    }

    // Add title search filter if provided
    if (titleParam) {
      // MySQL doesn't support mode: 'insensitive', use contains without mode
      where.title = {
        contains: titleParam,
        // MySQL is case-insensitive by default with utf8mb4_unicode_ci collation
      };
    }

    // Add date filters if provided with improved handling
    if (startDateParam) {
      try {
        // Validate and parse the start date
        const startDate = new Date(startDateParam);

        // Check if the date is valid
        if (!isNaN(startDate.getTime())) {
          console.log('Filtering projects with start date >=', startDate.toISOString());

          // Use a more flexible filter that checks both startDate and endDate
          // This allows finding projects that overlap with the filter period
          where.OR = [
            { startDate: { gte: startDate } },
            {
              AND: [{ startDate: { lte: startDate } }, { endDate: { gte: startDate } }],
            },
          ];
        } else {
          console.error('Invalid start date format:', startDateParam);
        }
      } catch (error) {
        console.error('Error processing start date:', error);
      }
    }

    if (endDateParam) {
      try {
        // Validate and parse the end date
        const endDate = new Date(endDateParam);

        // Check if the date is valid
        if (!isNaN(endDate.getTime())) {
          console.log('Filtering projects with end date <=', endDate.toISOString());

          // If we already have a start date filter, we need to modify the existing where.OR
          if (where.OR) {
            // Add end date condition to each existing OR condition
            where.OR = where.OR.map((condition: any) => ({
              AND: [condition, { endDate: { lte: endDate } }],
            }));
          } else {
            // If no start date filter, create a new filter
            where.endDate = { lte: endDate };
          }
        } else {
          console.error('Invalid end date format:', endDateParam);
        }
      } catch (error) {
        console.error('Error processing end date:', error);
      }
    }

    // Add team member filter if provided
    if (teamMemberIdsParam) {
      // Clean and validate team member IDs
      const teamMemberIds = teamMemberIdsParam
        .split(',')
        .map(id => id.trim())
        .filter(id => id !== '');

      console.log('Filtering projects by team member IDs:', teamMemberIds);

      if (teamMemberIds.length > 0) {
        where.teamMembers = {
          some: {
            userId: {
              in: teamMemberIds,
            },
          },
        };
      }
    }

    // Role-based filtering
    const userId = session.user.id;
    const userRole = session.user.role;

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }

    try {
      // Get total count based on the filtered criteria
      const total = await prisma.project.count({ where });

      // Get projects with pagination
      const projects = await prisma.project.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          statuses: true, // Project-specific statuses
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
            take: 10, // Limit to 10 team members per project for performance
          },
          _count: {
            select: {
              tasks: true,
              teamMembers: true,
            },
          },
        },
        orderBy: {
          [sortField]: sortDirection,
        },
        take: limit,
        skip: skip,
      });

      return NextResponse.json({
        projects: projects.map(project => ({
          ...project,
          startDate: project.startDate?.toISOString() || null,
          endDate: project.endDate?.toISOString() || null,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Database operation failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in projects API:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching projects' },
      { status: 500 }
    );
  }
}

// Validation schema for creating a project
const createProjectSchema = z.object({
  title: z
    .string()
    .min(3, 'Project title must be at least 3 characters long')
    .max(100, 'Project title cannot exceed 100 characters'),
  description: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  // Handle estimatedTime as string or number
  estimatedTime: z.union([
    z
      .string()
      .optional()
      .nullable()
      .transform(val => {
        if (!val) return null;
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
      }),
    z.number().optional().nullable(),
  ]),
  initialStatuses: z
    .array(
      z.object({
        name: z.string().min(1).max(50),
        color: z.string().optional(),
        description: z.string().optional().nullable(),
        isDefault: z.boolean().optional(),
      })
    )
    .optional(),
});

// POST handler to create a project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Unauthorized - Please log in again',
          details: { session: false },
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Validate request body
    const validationResult = createProjectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Verify user exists before creating project
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database', details: { userId: session.user.id } },
        { status: 404 }
      );
    }

    // Log the validated data for debugging
    console.log('Validated project data:', JSON.stringify(validationResult.data, null, 2));

    // Create project with user association
    const project = await prisma.project.create({
      data: {
        title: validationResult.data.title,
        description: validationResult.data.description,
        startDate:
          validationResult.data.startDate &&
          typeof validationResult.data.startDate === 'string' &&
          validationResult.data.startDate.trim() !== ''
            ? new Date(validationResult.data.startDate)
            : null,
        endDate:
          validationResult.data.endDate &&
          typeof validationResult.data.endDate === 'string' &&
          validationResult.data.endDate.trim() !== ''
            ? new Date(validationResult.data.endDate)
            : null,
        estimatedTime:
          validationResult.data.estimatedTime !== undefined
            ? validationResult.data.estimatedTime
            : null,
        createdById: user.id,
        teamMembers: {
          create: {
            userId: user.id,
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        statuses: true,
      },
    });

    // Create initial statuses if provided
    if (validationResult.data.initialStatuses && validationResult.data.initialStatuses.length > 0) {
      const statuses = [];

      // Find if there's a default status in the initial statuses
      const hasDefaultStatus = validationResult.data.initialStatuses.some(
        status => status.isDefault
      );

      // Create each status
      for (let i = 0; i < validationResult.data.initialStatuses.length; i++) {
        const statusData = validationResult.data.initialStatuses[i];

        // If no default status is specified, make the first one default
        const isDefault = statusData.isDefault || (!hasDefaultStatus && i === 0);

        const status = await prisma.projectStatus.create({
          data: {
            name: statusData.name,
            color: statusData.color || '#6E56CF', // Default color if not provided
            description: statusData.description,
            order: i,
            isDefault,
            projectId: project.id,
          },
        });

        statuses.push(status);
      }

      // Update the project with the created statuses
      const updatedProject = await prisma.project.findUnique({
        where: { id: project.id },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          teamMembers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          statuses: true,
        },
      });

      return NextResponse.json({ project: updatedProject });
    } else {
      // Create default statuses if none provided
      const defaultStatuses = [
        { name: 'To Do', color: '#3498db', isDefault: true, order: 0 },
        { name: 'In Progress', color: '#f39c12', isDefault: false, order: 1 },
        { name: 'Done', color: '#2ecc71', isDefault: false, order: 2 },
      ];

      for (const statusData of defaultStatuses) {
        await prisma.projectStatus.create({
          data: {
            ...statusData,
            projectId: project.id,
          },
        });
      }

      // Update the project with the created statuses
      const updatedProject = await prisma.project.findUnique({
        where: { id: project.id },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          teamMembers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          statuses: true,
        },
      });

      return NextResponse.json({ project: updatedProject });
    }
  } catch (error) {
    console.error('Error creating project:', error);

    // Check if it's a Prisma error
    if (
      error instanceof Error &&
      (error.name === 'PrismaClientKnownRequestError' ||
        error.name === 'PrismaClientValidationError')
    ) {
      return NextResponse.json(
        {
          error: 'Database validation error',
          details: {
            message: error.message,
            code: (error as any).code,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'An error occurred while creating the project',
        details: {
          message: error instanceof Error ? error.message : String(error),
          stack:
            process.env.NODE_ENV === 'development' && error instanceof Error
              ? error.stack
              : undefined,
        },
      },
      { status: 500 }
    );
  }
}
