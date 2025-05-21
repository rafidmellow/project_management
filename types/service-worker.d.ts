/**
 * Service Worker Type Definitions
 *
 * This file contains type definitions for service workers and background sync.
 */

/**
 * Extend the ServiceWorkerRegistration interface to include sync
 */
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
  sync: SyncManager;
  periodicSync?: {
    register(tag: string, options?: { minInterval: number }): Promise<void>;
    getTags(): Promise<string[]>;
    unregister(tag: string): Promise<void>;
  };
}

/**
 * Service worker message types
 */
export type ServiceWorkerMessageType =
  | 'SYNC_SUCCESS'
  | 'SYNC_COMPLETED'
  | 'SYNC_FAILURE'
  | 'SYNC_PERMANENT_FAILURE'
  | 'SYNC_REDUNDANT'
  | 'AUTO_CHECKOUT_COMPLETED';

/**
 * Service worker message
 */
export interface ServiceWorkerMessage {
  type: ServiceWorkerMessageType;
  record?: any;
  error?: string;
  message?: string;
  results?: any[];
  checkOutTime?: string;
  totalHours?: number;
}

/**
 * Attendance sync record
 */
export interface AttendanceSyncRecord {
  id: string;
  action: 'check-in' | 'check-out';
  data: any;
  timestamp: string;
  retryCount?: number;
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  record: AttendanceSyncRecord;
  error?: string;
  permanent?: boolean;
  willRetry?: boolean;
  redundant?: boolean;
  message?: string;
}
