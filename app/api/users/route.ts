import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';
import { getUsers, createUser } from '@/lib/queries/user-queries';
import { PermissionService } from '@/lib/permissions/unified-permission-service';
import { z } from 'zod';

// GET /api/users - Get all users with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('take') ? parseInt(searchParams.get('take')!) : 10;
    const skip = searchParams.get('skip')
      ? parseInt(searchParams.get('skip')!)
      : (page - 1) * limit;
    const orderBy = searchParams.get('orderBy') || 'createdAt';
    const direction = searchParams.get('direction') || 'desc';
    const includeProjects = searchParams.get('includeProjects') === 'true';
    const includeTasks = searchParams.get('includeTasks') === 'true';
    const includeTeams = searchParams.get('includeTeams') === 'true';
    const includeCounts = searchParams.get('includeCounts') === 'true';
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const projectId = searchParams.get('projectId');

    // Build the where clause
    const where: any = {};

    // For regular users, only return team members they work with
    // Check permission based on the latest role from the database
    const hasTeamViewPermission = await PermissionService.hasPermissionById(
      session.user.id,
      'team_view'
    );

    // If user has team_view permission, they can see all users
    // If not and no specific project is requested, limit to users in the same projects
    if (!hasTeamViewPermission && !projectId) {
      // Get projects the user is part of
      const userProjects = await prisma.teamMember.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          projectId: true,
        },
      });

      const userProjectIds = userProjects.map(p => p.projectId);

      // Only show users who are in the same projects
      where.teams = {
        some: {
          projectId: {
            in: userProjectIds,
          },
        },
      };
    }

    if (role && role !== 'all') {
      where.role = role;
    }

    if (search) {
      where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
    }

    // Add project filtering if projectId is provided
    if (projectId) {
      where.teams = {
        some: {
          projectId,
        },
      };
    }

    // Build the orderBy clause
    const orderByClause: any = { [orderBy]: direction };

    // Fetch users with our enhanced getUsers function
    const result = await getUsers({
      skip,
      take: limit,
      orderBy: orderByClause,
      where,
      includeProjects,
      includeTasks,
      includeTeams,
      includeCounts,
    });

    // Return in the format expected by the client
    return NextResponse.json({
      users: result.users,
      pagination: {
        page,
        limit,
        totalCount: result.pagination.totalCount,
        totalPages: Math.ceil(result.pagination.totalCount / limit),
      },
      ...(result.counts ? { counts: result.counts } : {}),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}

// Define validation schema for registration
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.string().optional(),
  image: z.string().optional(),
  isRegistration: z.boolean().optional(),
});

// POST /api/users - Create a new user (admin) or register a new user (public)
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    // Check if this is a registration request (public) or user creation (admin)
    const isRegistration = body.isRegistration === true;

    // For admin user creation, check authentication
    if (!isRegistration) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Only admins can set roles other than 'user'
      if (body.role && body.role !== 'user' && session.user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized: Only admins can create users with elevated roles' },
          { status: 403 }
        );
      }
    }

    // Validate request body
    const validationResult = userSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password, role, image } = validationResult.data;

    // For registration, force role to be 'user'
    const userRole = isRegistration ? 'user' : role;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // Create user
    const user = await createUser({
      name,
      email,
      password,
      role: userRole,
      image,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    // Handle duplicate email
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    );
  }
}
