'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { useAuthSession } from '@/hooks/use-auth-session';
import { toast } from 'sonner';
import { ClientPermissionService } from '@/lib/permissions/client-permission-service';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export function AuthGuard({ children, requiredPermission }: AuthGuardProps) {
  const { session, status, checkSession } = useAuthSession();
  const router = useRouter();
  const pathname = usePathname();
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);

  // Use ref to track if we've checked the session already
  const sessionChecked = useRef(false);

  // Public paths that don't require authentication
  const isPublicPath =
    pathname.includes('/login') || pathname.includes('/register') || pathname === '/';

  // Check permission with the server
  const checkPermissionWithServer = async (permission: string, userId: string) => {
    setIsCheckingPermission(true);
    try {
      const response = await fetch(
        `/api/users/check-permission?userId=${encodeURIComponent(userId)}&permission=${encodeURIComponent(permission)}`
      );
      const data = await response.json();
      setHasPermission(data.hasPermission);
      setPermissionChecked(true);
      setIsCheckingPermission(false);

      if (!data.hasPermission) {
        toast.error('Access denied', {
          description: "You don't have permission to access this page",
          duration: 5000,
        });
        router.push('/dashboard');
      }

      return data.hasPermission;
    } catch (error) {
      console.error('Error checking permission:', error);
      // Fall back to client-side check on error
      const clientCheck = ClientPermissionService.hasPermissionByIdSync(userId, permission);
      setHasPermission(clientCheck);
      setPermissionChecked(true);
      setIsCheckingPermission(false);

      if (!clientCheck) {
        toast.error('Access denied', {
          description: "You don't have permission to access this page",
          duration: 5000,
        });
        router.push('/dashboard');
      }

      return clientCheck;
    }
  };

  useEffect(() => {
    // Create an async function inside the effect
    const checkAuth = async () => {
      // Do nothing while authentication status is loading
      if (status === 'loading') return;

      // Redirect if user is not logged in and trying to access a protected route
      if (status === 'unauthenticated' && !isPublicPath) {
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        return;
      }

      // If authenticated, verify the session is still valid
      if (status === 'authenticated' && !sessionChecked.current) {
        // Only check the session once when the component mounts
        // or when the pathname changes (navigation)
        sessionChecked.current = true;

        checkSession().catch(() => {
          // Session check failed, but we'll let the hook handle the redirect
        });
      }

      // Check permission-based access if a permission is specified
      if (
        status === 'authenticated' &&
        requiredPermission &&
        session?.user?.id &&
        !permissionChecked &&
        !isCheckingPermission
      ) {
        // First do a quick client-side check
        const quickCheck = ClientPermissionService.hasPermissionByIdSync(
          session.user.id,
          requiredPermission
        );

        // If quick check passes, we can allow access immediately
        if (quickCheck) {
          setHasPermission(true);
          setPermissionChecked(true);
        } else {
          // Otherwise, verify with the server
          await checkPermissionWithServer(requiredPermission, session.user.id);
        }
      }
    };

    // Call the async function
    checkAuth();
  }, [
    status,
    router,
    pathname,
    session,
    requiredPermission,
    checkSession,
    isPublicPath,
    permissionChecked,
    isCheckingPermission,
  ]);

  // Show minimal loading state while checking authentication or permissions
  if (status === 'loading' || (requiredPermission && !permissionChecked && isCheckingPermission)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  // Show children if user is authenticated and has the required permissions
  if (status === 'authenticated' && (!requiredPermission || (permissionChecked && hasPermission))) {
    return <>{children}</>;
  }

  // Allow access to public pages when unauthenticated
  if (status === 'unauthenticated' && isPublicPath) {
    return <>{children}</>;
  }

  // Default - show nothing while redirecting
  return null;
}
