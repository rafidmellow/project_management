import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { EdgePermissionService } from '@/lib/permissions/edge-permission-service';

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/api/auth',
  '/api/users', // Allow access to user creation for registration
  '/api/auth-status',
  '/api/permissions/matrix', // Allow access to permission matrix for middleware
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
  '/sw.js', // Allow service worker script access
  '/manifest.json', // Allow PWA manifest access
  '/api/trpc', // Allow access to tRPC if used
  '/api/health', // Allow health checks
  '/api/webhooks', // Allow webhooks
];

// Permission-protected paths mapping
const PROTECTED_PATHS = {
  // Admin-only paths
  '/team/permissions': 'manage_permissions', // Changed from manage_roles to manage_permissions
  '/team/roles': 'manage_roles',
  '/api/roles': 'manage_roles',
  '/api/permissions': 'manage_permissions', // Changed from manage_roles to manage_permissions

  // User management paths
  '/api/users': 'user_management',

  // Project management paths
  '/projects/new': 'project_creation',

  // Attendance management paths
  '/attendance/admin': 'attendance_management',
  '/api/attendance/admin': 'attendance_management',
  '/api/attendance/admin/records': 'attendance_management',
  '/api/attendance/admin/correction-requests': 'attendance_management',

  // System settings paths
  '/settings': 'system_settings',
  '/api/settings': 'system_settings',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is public
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check if the user is authenticated
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If not authenticated, redirect to login
  if (!token) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, request.url)
    );
  }

  // Permission-based access control for specific paths
  const userId = token.sub as string;

  // Check if the path is protected by a specific permission
  for (const [protectedPath, requiredPermission] of Object.entries(PROTECTED_PATHS)) {
    if (pathname.startsWith(protectedPath)) {
      // Special case for user-specific API routes
      if (protectedPath === '/api/users') {
        // Allow users to access their own data
        const userIdInPath = pathname.match(/\/api\/users\/([^/]+)/)?.[1];
        if (userIdInPath && userIdInPath === userId) {
          return NextResponse.next();
        }
      }

      // Check if the user has the required permission using the token-based method
      const hasPermission = EdgePermissionService.hasPermissionForToken(token, requiredPermission);

      if (!hasPermission) {
        // For API routes, return a JSON error
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Forbidden: Insufficient permissions' },
            { status: 403 }
          );
        }

        // For UI routes, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  // If we get here, the user is authenticated and has the required permissions
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (API routes for authentication)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, fonts, etc.)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
};
