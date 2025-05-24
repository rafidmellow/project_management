'use client';
import { devLog } from '@/lib/utils/logger';

import { useEffect, useState } from 'react';
import { registerServiceWorker, isServiceWorkerSupported } from '@/lib/service-worker';
import { AutoCheckoutHandler } from '@/components/attendance/auto-checkout-handler';
import { useSession } from 'next-auth/react';

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const [swRegistered, setSwRegistered] = useState(false);
  const { status } = useSession();

  // Initial service worker registration
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if service workers are supported
    if (!isServiceWorkerSupported()) {
      devLog('Service Workers are not supported in this browser');
      return;
    }

    const registerSW = async () => {
      try {
        devLog('Attempting to register Service Worker...');
        const registered = await registerServiceWorker();
        setSwRegistered(registered);

        if (registered) {
          devLog('✅ Service Worker registered successfully');
        } else {
          console.warn('⚠️ Service Worker registration failed - check console for details');
        }
      } catch (error) {
        console.error('❌ Error registering Service Worker:', error);
        setSwRegistered(false);
      }
    };

    // Add a small delay to ensure the page is fully loaded
    const timeoutId = setTimeout(registerSW, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  // Periodic check to ensure service worker is still registered
  useEffect(() => {
    if (typeof window === 'undefined' || !isServiceWorkerSupported()) return;

    // Check service worker registration status every 30 minutes
    const checkInterval = 30 * 60 * 1000;

    const checkRegistration = async () => {
      try {
        // Check if we have an active service worker
        const registrations = await navigator.serviceWorker.getRegistrations();

        if (registrations.length === 0 && !swRegistered) {
          devLog('No service worker found, attempting to register');
          const registered = await registerServiceWorker();
          setSwRegistered(registered);
        }
      } catch (error) {
        console.error('Error checking service worker registration:', error);
      }
    };

    const intervalId = setInterval(checkRegistration, checkInterval);

    // Also check when the app comes back online
    const handleOnline = () => {
      devLog('App is back online, checking service worker registration');
      checkRegistration();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
    };
  }, [swRegistered]);

  return (
    <>
      {status === 'authenticated' && <AutoCheckoutHandler />}
      {children}
    </>
  );
}
