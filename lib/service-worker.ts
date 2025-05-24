import { devLog } from '@/lib/utils/logger';
/**
 * Service Worker Registration Utility
 *
 * This file handles the registration of the service worker and provides
 * utilities for working with background sync.
 */
import { ServiceWorkerMessage } from '@/types/service-worker';

// Import the ExtendedServiceWorkerRegistration interface
declare global {
  interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
    sync: {
      register(tag: string): Promise<void>;
      getTags(): Promise<string[]>;
    };
    periodicSync?: {
      register(tag: string, options?: { minInterval: number }): Promise<void>;
      getTags(): Promise<string[]>;
      unregister(tag: string): Promise<void>;
    };
  }
}

// Check if service workers and background sync are supported
export const isServiceWorkerSupported = (): boolean =>
  typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

export const isBackgroundSyncSupported = (): boolean =>
  typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'SyncManager' in window;

// Register the service worker with retry mechanism
export async function registerServiceWorker(maxRetries = 3) {
  if (!isServiceWorkerSupported()) {
    devLog('Service Workers are not supported in this browser');
    return false;
  }

  let retries = 0;

  while (retries < maxRetries) {
    try {
      // Use absolute URL to avoid redirect issues
      const swUrl = `${window.location.origin}/sw.js`;

      // First, check if the service worker file is accessible
      const swResponse = await fetch(swUrl, { method: 'HEAD' });
      if (!swResponse.ok) {
        throw new Error(
          `Service Worker script not accessible: ${swResponse.status} ${swResponse.statusText}`
        );
      }

      // Check if we're being redirected
      if (swResponse.url !== swUrl) {
        throw new Error(`Service Worker script is behind a redirect: ${swResponse.url}`);
      }

      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/',
        updateViaCache: 'none', // Always fetch fresh service worker
      });

      devLog('Service Worker registered with scope:', registration.scope);

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      devLog('Service Worker is ready');

      return true;
    } catch (error) {
      retries++;
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.error(
        `Service Worker registration failed (attempt ${retries}/${maxRetries}):`,
        errorMessage
      );

      // Don't retry for certain types of errors
      if (errorMessage.includes('redirect') || errorMessage.includes('not accessible')) {
        console.error(
          'Service Worker registration failed due to access/redirect issue. Not retrying.'
        );
        return false;
      }

      if (retries >= maxRetries) {
        console.error('Max retries reached for Service Worker registration');
        return false;
      }

      // Exponential backoff with jitter
      const baseDelay = Math.pow(2, retries) * 1000;
      const jitter = Math.random() * 1000;
      const delay = baseDelay + jitter;

      devLog(`Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return false;
}

// Request background sync permission
export async function requestBackgroundSyncPermission() {
  if (!isBackgroundSyncSupported()) {
    devLog('Background Sync is not supported in this browser');
    return false;
  }

  try {
    // Request notification permission (often needed for background sync)
    const notificationPermission = await Notification.requestPermission();
    if (notificationPermission !== 'granted') {
      devLog('Notification permission not granted');
    }

    return true;
  } catch (error) {
    console.error('Error requesting background sync permission:', error);
    return false;
  }
}

// Register a background sync
export async function registerBackgroundSync(): Promise<boolean> {
  if (!isBackgroundSyncSupported()) {
    devLog('Background Sync is not supported in this browser');
    return false;
  }

  try {
    const registration = (await navigator.serviceWorker.ready) as ExtendedServiceWorkerRegistration;

    // Register attendance sync
    if ('sync' in registration) {
      await registration.sync.register('attendance-sync');
      devLog('Attendance background sync registered!');

      // Register auto-checkout sync
      await registration.sync.register('auto-checkout-sync');
      devLog('Auto-checkout background sync registered!');
    } else {
      devLog('Sync API not available in this browser');
    }

    return true;
  } catch (error) {
    console.error('Background sync registration failed:', error);
    return false;
  }
}

// Register auto-checkout sync specifically
export async function registerAutoCheckoutSync(): Promise<boolean> {
  if (!isBackgroundSyncSupported()) {
    devLog('Background Sync is not supported in this browser');
    return false;
  }

  try {
    const registration = (await navigator.serviceWorker.ready) as ExtendedServiceWorkerRegistration;
    if ('sync' in registration) {
      await registration.sync.register('auto-checkout-sync');
      devLog('Auto-checkout sync registered!');
      return true;
    } else {
      devLog('Sync API not available in this browser');
      return false;
    }
  } catch (error) {
    console.error('Auto-checkout sync registration failed:', error);
    return false;
  }
}

// Listen for messages from the service worker
export function listenForServiceWorkerMessages(
  callback: (data: ServiceWorkerMessage) => void
): () => void {
  if (!isServiceWorkerSupported()) {
    return () => {}; // Return a no-op cleanup function
  }

  const messageHandler = (event: MessageEvent) => {
    if (
      event.data &&
      (event.data.type === 'SYNC_SUCCESS' ||
        event.data.type === 'SYNC_COMPLETED' ||
        event.data.type === 'AUTO_CHECKOUT_COMPLETED' ||
        event.data.type === 'SYNC_FAILURE' ||
        event.data.type === 'SYNC_PERMANENT_FAILURE' ||
        event.data.type === 'SYNC_REDUNDANT')
    ) {
      callback(event.data as ServiceWorkerMessage);
    }
  };

  navigator.serviceWorker.addEventListener('message', messageHandler);

  // Return a cleanup function
  return () => {
    navigator.serviceWorker.removeEventListener('message', messageHandler);
  };
}
