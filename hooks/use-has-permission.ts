'use client';

import { useState, useEffect } from 'react';
import { useAuthSession } from './use-auth-session';
import { ClientPermissionService } from '@/lib/permissions/client-permission-service';

/**
 * Hook to check if the current user has a specific permission
 * Uses both client-side and server-side permission checks for optimal performance
 *
 * @param permission The permission to check
 * @param redirectTo Optional path to redirect to if user doesn't have permission
 * @returns An object with hasPermission, isLoading, and error properties
 */
export function useHasPermission(permission: string, redirectTo?: string) {
  const { session, status } = useAuthSession();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no session, user doesn't have permission
    if (!session?.user?.id || status === 'loading') {
      setHasPermission(false);
      setIsLoading(false);
      return;
    }

    // Use the client permission service for a quick initial check
    const userId = session.user.id;
    const quickResult = ClientPermissionService.hasPermissionByIdSync(userId, permission);

    // If the quick check passes, we can return true immediately
    if (quickResult) {
      setHasPermission(true);
      setIsLoading(false);
      return;
    }

    // If quick check fails, verify with the API
    // This handles the case where permissions might be in the database but not in the client cache
    setIsLoading(true);

    fetch(
      `/api/users/check-permission?userId=${encodeURIComponent(userId)}&permission=${encodeURIComponent(permission)}`
    )
      .then(res => res.json())
      .then(data => {
        setHasPermission(data.hasPermission);
        setIsLoading(false);

        // Handle redirection if needed
        if (redirectTo && !data.hasPermission) {
          window.location.href = redirectTo;
        }
      })
      .catch(err => {
        console.error('Error checking permission:', err);
        setError('Failed to check permission');
        // Fall back to the client-side check on error
        setHasPermission(quickResult);
        setIsLoading(false);
      });
  }, [session, status, permission, redirectTo]);

  return { hasPermission, isLoading, error };
}
