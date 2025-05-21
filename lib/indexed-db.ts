/**
 * IndexedDB Utilities for Offline Queue
 *
 * This file provides utilities for working with IndexedDB to store
 * attendance records when offline.
 */

const DB_NAME = 'attendance-db';
const DB_VERSION = 1;
const ATTENDANCE_SYNC_QUEUE = 'attendance-sync-queue';

// Types
export interface AttendanceRecord {
  id: string;
  action: 'check-in' | 'check-out';
  timestamp: string;
  data: any;
  retryCount?: number;
  lastAttempt?: string;
}

// Open the database
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(ATTENDANCE_SYNC_QUEUE)) {
        db.createObjectStore(ATTENDANCE_SYNC_QUEUE, { keyPath: 'id' });
      }
    };

    request.onsuccess = event => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = event => {
      reject(new Error('Error opening IndexedDB'));
    };
  });
}

// Add a record to the queue
export async function addToSyncQueue(
  record: Omit<AttendanceRecord, 'id'>
): Promise<AttendanceRecord> {
  try {
    const db = await openDatabase();

    // Create a new record with ID and initial retry count
    const newRecord: AttendanceRecord = {
      ...record,
      id: generateId(),
      retryCount: 0,
      lastAttempt: null,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ATTENDANCE_SYNC_QUEUE, 'readwrite');
      const store = transaction.objectStore(ATTENDANCE_SYNC_QUEUE);
      const request = store.add(newRecord);

      request.onsuccess = () => {
        resolve(newRecord);
      };

      request.onerror = () => {
        reject(new Error('Error adding record to IndexedDB'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error in addToSyncQueue:', error);
    throw error;
  }
}

// Get all records from the queue
export async function getSyncQueue(): Promise<AttendanceRecord[]> {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ATTENDANCE_SYNC_QUEUE, 'readonly');
      const store = transaction.objectStore(ATTENDANCE_SYNC_QUEUE);
      const request = store.getAll();

      request.onsuccess = event => {
        resolve((event.target as IDBRequest).result);
      };

      request.onerror = () => {
        reject(new Error('Error getting records from IndexedDB'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error in getSyncQueue:', error);
    return [];
  }
}

// Remove a record from the queue
export async function removeFromSyncQueue(id: string): Promise<void> {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ATTENDANCE_SYNC_QUEUE, 'readwrite');
      const store = transaction.objectStore(ATTENDANCE_SYNC_QUEUE);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Error removing record from IndexedDB'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error in removeFromSyncQueue:', error);
    throw error;
  }
}

// Update a record in the queue (for retry counts)
export async function updateRecordInQueue(record: AttendanceRecord): Promise<void> {
  try {
    const db = await openDatabase();

    // Update the lastAttempt timestamp
    record.lastAttempt = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ATTENDANCE_SYNC_QUEUE, 'readwrite');
      const store = transaction.objectStore(ATTENDANCE_SYNC_QUEUE);
      const request = store.put(record);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Error updating record in IndexedDB'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error in updateRecordInQueue:', error);
    throw error;
  }
}

// Clear the entire queue
export async function clearSyncQueue(): Promise<void> {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ATTENDANCE_SYNC_QUEUE, 'readwrite');
      const store = transaction.objectStore(ATTENDANCE_SYNC_QUEUE);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Error clearing IndexedDB'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error in clearSyncQueue:', error);
    throw error;
  }
}

// Generate a unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
