import { NextRequest, NextResponse } from 'next/server';
import { Session } from 'next-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PermissionService } from '@/lib/permissions/unified-permission-service';
import { PermissionCheckFn } from '@/types/api';

/**
 * Middleware for API routes to handle authentication and authorization
 *
 * @param handler The API route handler function
 * @param requiredPermission Optional permission required to access the route
 * @returns A new handler function with authentication and authorization checks
 */
export function withAuth(
  handler: (req: NextRequest, context: any, session: Session) => Promise<NextResponse>,
  requiredPermission?: string
) {
  return async (req: NextRequest, context: any) => {
    try {
      // Check authentication
      const session = await getServerSession(authOptions);

      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check authorization if a permission is required
      if (requiredPermission) {
        const hasPermission = await PermissionService.hasPermissionById(
          session.user.id,
          requiredPermission
        );

        if (!hasPermission) {
          return NextResponse.json(
            { error: 'Forbidden: Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      // Call the original handler with the session
      return handler(req, context, session);
    } catch (error) {
      console.error('API middleware error:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware for API routes that require a specific permission
 *
 * @param permission The permission required to access the route
 * @param handler The API route handler function
 * @returns A new handler function with permission checks
 */
export function withPermission(
  permission: string,
  handler: (req: NextRequest, context: any, session: Session) => Promise<NextResponse>
) {
  return withAuth(async (req: NextRequest, context: any, session: Session) => {
    try {
      // Check if the user has the required permission
      const hasPermission = await PermissionService.hasPermissionById(session.user.id, permission);

      if (!hasPermission) {
        return NextResponse.json(
          { error: `Forbidden: You don't have the required permission (${permission})` },
          { status: 403 }
        );
      }

      // Call the original handler
      return handler(req, context, session);
    } catch (error) {
      console.error('API permission middleware error:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  });
}

/**
 * Middleware for API routes that need to check resource-specific permissions
 *
 * @param resourceIdParam The name of the parameter containing the resource ID
 * @param permissionChecker Function that checks if the user has permission for the specific resource
 * @param handler The API route handler function
 * @param defaultAction The default action to use if not determined from the HTTP method
 * @returns A new handler function with resource-specific permission checks
 */
export function withResourcePermission(
  resourceIdParam: string,
  permissionChecker: (
    resourceId: string,
    session: Session | null,
    action?: string | undefined
  ) => Promise<{
    hasPermission: boolean;
    error?: string | null | undefined;
    task?: any;
    teamMember?: any;
    project?: any;
  }>,
  handler: (
    req: NextRequest,
    context: any,
    session: Session,
    resourceId: string
  ) => Promise<NextResponse>,
  defaultAction: string = 'view'
) {
  return withAuth(async (req: NextRequest, context: any, session: Session) => {
    try {
      // Get the resource ID from the params
      const params = await context.params;
      const resourceId = params[resourceIdParam];

      if (!resourceId) {
        return NextResponse.json({ error: `${resourceIdParam} is required` }, { status: 400 });
      }

      // Determine the action based on the HTTP method
      let action = defaultAction;
      switch (req.method) {
        case 'POST':
          action = 'create';
          break;
        case 'PUT':
        case 'PATCH':
          action = 'update';
          break;
        case 'DELETE':
          action = 'delete';
          break;
      }

      // Check resource-specific permission
      const { hasPermission, error } = await permissionChecker(resourceId, session, action);

      if (!hasPermission) {
        return NextResponse.json(
          { error: error || 'Forbidden: Insufficient permissions' },
          { status: error?.includes('not found') ? 404 : 403 }
        );
      }

      // Call the original handler with the resource ID
      return handler(req, context, session, resourceId);
    } catch (error) {
      console.error('API resource permission middleware error:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  });
}

/**
 * Middleware for checking if a user is the owner of a resource or has required permission
 *
 * @param resourceIdParam The name of the parameter containing the resource ID
 * @param resourceFetcher Function that fetches the resource and returns the user ID associated with it
 * @param handler The API route handler function
 * @param requiredPermission The permission required to access the resource if not the owner
 * @returns A new handler function with ownership and permission checks
 */
export function withOwnerOrPermission(
  resourceIdParam: string,
  resourceFetcher: (resourceId: string) => Promise<{ userId: string } | null>,
  handler: (
    req: NextRequest,
    context: any,
    session: Session,
    resourceId: string
  ) => Promise<NextResponse>,
  requiredPermission: string
) {
  return withAuth(async (req: NextRequest, context: any, session: Session) => {
    try {
      // Get the resource ID from the params
      const params = await context.params;
      const resourceId = params[resourceIdParam];

      if (!resourceId) {
        return NextResponse.json({ error: `${resourceIdParam} is required` }, { status: 400 });
      }

      // Fetch the resource
      const resource = await resourceFetcher(resourceId);

      if (!resource) {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
      }

      // Check if the user is the owner
      const isOwner = session.user.id === resource.userId;

      if (isOwner) {
        // Owner always has access
        return handler(req, context, session, resourceId);
      }

      // If not the owner, check for the required permission
      const hasPermission = await PermissionService.hasPermissionById(
        session.user.id,
        requiredPermission
      );

      if (!hasPermission) {
        return NextResponse.json(
          { error: `Forbidden: You need ${requiredPermission} permission to access this resource` },
          { status: 403 }
        );
      }

      // Call the original handler with the resource ID
      return handler(req, context, session, resourceId);
    } catch (error) {
      console.error('API owner/permission middleware error:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  });
}

/**
 * Legacy middleware for checking if a user is the owner of a resource or has admin privileges
 * @deprecated Use withOwnerOrPermission instead
 */
export function withOwnerOrAdmin(
  resourceIdParam: string,
  resourceFetcher: (resourceId: string) => Promise<{ userId: string } | null>,
  handler: (
    req: NextRequest,
    context: any,
    session: Session,
    resourceId: string
  ) => Promise<NextResponse>,
  adminOnly: boolean = false
) {
  // Map adminOnly to the appropriate permission
  const requiredPermission = adminOnly ? 'user_management' : 'view_projects';

  // Use the new withOwnerOrPermission function
  return withOwnerOrPermission(resourceIdParam, resourceFetcher, handler, requiredPermission);
}
