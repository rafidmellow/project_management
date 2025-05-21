'use client';

import { ReactNode } from 'react';
import { useHasPermission } from '@/hooks/use-has-permission';
import { Spinner } from '@/components/ui/spinner';

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
  showLoading?: boolean;
  loadingComponent?: ReactNode;
}

/**
 * Component that only renders its children if the user has the specified permission
 * Uses the useHasPermission hook for permission checking
 */
export function PermissionGuard({
  permission,
  children,
  fallback = null,
  showLoading = true,
  loadingComponent = null,
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = useHasPermission(permission);

  // Show loading state if requested and still checking permissions
  if (isLoading && showLoading) {
    return (
      <>
        {loadingComponent || (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        )}
      </>
    );
  }

  // If permission check is complete and user has permission, render children
  if (hasPermission) {
    return <>{children}</>;
  }

  // Otherwise, render fallback
  return <>{fallback}</>;
}
