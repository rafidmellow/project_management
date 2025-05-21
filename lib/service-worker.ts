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
    console.log('Service Workers are not supported in this browser');
    return false;
  }

  let retries = 0;

  while (retries < maxRetries) {
    try {
      // Use absolute URL to avoid redirect issues
      const swUrl = `${window.location.origin}/sw.js`;
      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/',
      });
      console.log('Service Worker registered with scope:', registration.scope);

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('Service Worker is ready');

      return true;
    } catch (error) {
      retries++;
      console.error(
        `Service Worker registration failed (attempt ${retries}/${maxRetries}):`,
        error
      );

      if (retries >= maxRetries) {
        console.error('Max retries reached for Service Worker registration');
        return false;
      }

      // Exponential backoff
      const delay = Math.pow(2, retries) * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return false;
}

// Request background sync permission
export async function requestBackgroundSyncPermission() {
  if (!isBackgroundSyncSupported()) {
    console.log('Background Sync is not supported in this browser');
    return false;
  }

  try {
    // Request notification permission (often needed for background sync)
    const notificationPermission = await Notification.requestPermission();
    if (notificationPermission !== 'granted') {
      console.log('Notification permission not granted');
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
    console.log('Background Sync is not supported in this browser');
    return false;
  }

  try {
    const registration = (await navigator.serviceWorker.ready) as ExtendedServiceWorkerRegistration;

    // Register attendance sync
    if ('sync' in registration) {
      await registration.sync.register('attendance-sync');
      console.log('Attendance background sync registered!');

      // Register auto-checkout sync
      await registration.sync.register('auto-checkout-sync');
      console.log('Auto-checkout background sync registered!');
    } else {
      console.log('Sync API not available in this browser');
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
    console.log('Background Sync is not supported in this browser');
    return false;
  }

  try {
    const registration = (await navigator.serviceWorker.ready) as ExtendedServiceWorkerRegistration;
    if ('sync' in registration) {
      await registration.sync.register('auto-checkout-sync');
      console.log('Auto-checkout sync registered!');
      return true;
    } else {
      console.log('Sync API not available in this browser');
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
