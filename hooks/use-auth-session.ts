'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Enhanced hook for handling authentication sessions with expiration handling
 * @returns The session data, status, and a function to check if the session is valid
 */
export function useAuthSession() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Session timeout in milliseconds (30 minutes)
  const SESSION_TIMEOUT = 30 * 60 * 1000;

  // Update last activity time on user interaction
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    // Add event listeners for user activity
    window.addEventListener('click', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('mousemove', updateActivity);

    return () => {
      // Clean up event listeners
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('mousemove', updateActivity);
    };
  }, []);

  // Check for session timeout
  useEffect(() => {
    if (status !== 'authenticated') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;

      if (timeSinceLastActivity > SESSION_TIMEOUT) {
        // Session has timed out due to inactivity
        toast.warning('Your session has expired due to inactivity', {
          description: 'Please sign in again to continue.',
          duration: 5000,
        });

        signOut({ callbackUrl: '/login' });
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [status, lastActivity, router]);

  // Function to check if the session is valid and refresh if needed
  const checkSession = async () => {
    // Only check if we're authenticated and haven't checked recently
    if (status === 'authenticated') {
      try {
        // Use a timestamp to prevent frequent checks
        let lastCheck = null;
        const now = Date.now();

        // Check if we're in a browser environment before using sessionStorage
        if (typeof window !== 'undefined') {
          lastCheck = sessionStorage.getItem('lastSessionCheck');

          // Only check once every 5 minutes
          if (!lastCheck || now - parseInt(lastCheck) > 5 * 60 * 1000) {
            sessionStorage.setItem('lastSessionCheck', now.toString());

            // Check if the session is still valid on the server
            const response = await fetch('/api/auth-status');
            const data = await response.json();

            if (!data.authenticated) {
              // Session is no longer valid on the server
              toast.warning('Your session has expired', {
                description: 'Please sign in again to continue.',
                duration: 5000,
              });

              signOut({ callbackUrl: '/login' });
              return false;
            }

            // Only update if necessary - this is what's causing the loop
            if (data.session && JSON.stringify(data.session) !== JSON.stringify(session)) {
              await update();
            }
          }
        }

        return true;
      } catch (error) {
        console.error('Error checking session:', error);
        return false;
      }
    }

    return false;
  };

  return { session, status, checkSession };
}
