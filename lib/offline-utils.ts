/**
 * Utilities for handling offline operations
 */

// Types for offline queue
export interface OfflineAction {
  id: string;
  type: 'check-in' | 'check-out';
  timestamp: string;
  data: any;
}

// Save action to offline queue
export function saveToOfflineQueue(action: Omit<OfflineAction, 'id' | 'timestamp'>): OfflineAction {
  // Get existing queue
  const queue = getOfflineQueue();

  // Create new action with ID and timestamp
  const newAction: OfflineAction = {
    ...action,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  // Add to queue and save
  queue.push(newAction);
  localStorage.setItem('attendanceOfflineQueue', JSON.stringify(queue));

  return newAction;
}

// Get offline queue
export function getOfflineQueue(): OfflineAction[] {
  try {
    const queue = localStorage.getItem('attendanceOfflineQueue');
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    return [];
  }
}

// Remove action from queue
export function removeFromOfflineQueue(id: string): void {
  const queue = getOfflineQueue();
  const updatedQueue = queue.filter(action => action.id !== id);
  localStorage.setItem('attendanceOfflineQueue', JSON.stringify(updatedQueue));
}

// Clear offline queue
export function clearOfflineQueue(): void {
  localStorage.removeItem('attendanceOfflineQueue');
}

// Generate a simple ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Check if browser is online
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// Check if network is actually reachable by pinging the API
export async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    // Use a simple HEAD request to check connectivity
    const response = await fetch('/api/health', {
      method: 'HEAD',
      // Short timeout to avoid long waits
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
