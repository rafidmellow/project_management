'use client';

import { useState, useEffect } from 'react';
import { ClientPermissionService } from '@/lib/permissions/client-permission-service';
import { useAuthSession } from './use-auth-session';

/**
 * Hook to check if the current user has a specific permission
 * Uses both client-side and server-side permission checks for optimal performance
 * @deprecated Use useHasPermission instead for better naming consistency
 */
export function usePermission(permission: string) {
  const { session } = useAuthSession();
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If no session, user doesn't have permission
    if (!session?.user?.id) {
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
      })
      .catch(err => {
        console.error('Error checking permission:', err);
        // Fall back to the client-side check on error
        setHasPermission(quickResult);
        setIsLoading(false);
      });
  }, [session, permission]);

  return { hasPermission, isLoading };
}

/**
 * Hook to get all permissions for a specific user
 * Uses both client-side and server-side permission checks for optimal performance
 */
export function useUserPermissionsByUserId(userId: string) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    // Get initial permissions from client-side service for quick response
    const quickPermissions = ClientPermissionService.getPermissionsForUserSync(userId);

    // Set initial permissions
    setPermissions(quickPermissions);

    // Then fetch the complete list from the server
    fetch(`/api/users/permissions?userId=${encodeURIComponent(userId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.permissions && Array.isArray(data.permissions)) {
          setPermissions(data.permissions);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching permissions:', err);
        // Keep the client-side permissions on error
        setIsLoading(false);
      });
  }, [userId]);

  return { permissions, isLoading };
}

/**
 * Hook to get all permissions for the current user
 * Uses both client-side and server-side permission checks for optimal performance
 */
export function useUserPermissions() {
  const { session, status } = useAuthSession();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(status === 'loading');

    // If no session, user has no permissions
    if (!session?.user?.id) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    // Get initial permissions from client-side service for quick response
    const userId = session.user.id;
    const quickPermissions = ClientPermissionService.getPermissionsForUserSync(userId);

    // Set initial permissions
    setPermissions(quickPermissions);

    // Then fetch the complete list from the server
    fetch(`/api/users/permissions?userId=${encodeURIComponent(userId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.permissions && Array.isArray(data.permissions)) {
          setPermissions(data.permissions);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching permissions:', err);
        // Keep the client-side permissions on error
        setIsLoading(false);
      });
  }, [session, status]);

  return { permissions, isLoading };
}

export function useUserRole() {
  const { session, status } = useAuthSession();
  const [role, setRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(status === 'loading');

    // If no session, user has no role
    if (!session?.user?.id) {
      setRole('');
      setIsLoading(false);
      return;
    }

    // First use the role from the session for quick initial display
    if (session.user.role) {
      setRole(session.user.role);
    }

    // Then fetch the up-to-date role from the server
    fetch(`/api/users/${encodeURIComponent(session.user.id)}?profile=false`)
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role) {
          setRole(data.user.role);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching user role:', err);
        // Keep the session role on error
        setIsLoading(false);
      });
  }, [session, status]);

  return { role, isLoading };
}
