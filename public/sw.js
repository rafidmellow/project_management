// Service Worker for Background Sync and Offline Support
const CACHE_NAME = 'attendance-cache-v3'; // Increment version when making changes
const STATIC_CACHE_NAME = 'attendance-static-v3';
const DYNAMIC_CACHE_NAME = 'attendance-dynamic-v3';
const ATTENDANCE_SYNC_QUEUE = 'attendance-sync-queue';
const AUTO_CHECKOUT_SYNC_TAG = 'auto-checkout-sync';

// Essential files to cache during installation
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/attendance/dashboard',
  '/attendance/history',
  '/attendance/statistics',
  // Add CSS, JS, and image assets that should be available offline
];

// Pages that should have offline fallbacks
const OFFLINE_FALLBACK_PAGES = [
  '/attendance',
  '/projects',
  '/tasks',
  '/dashboard'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');

  // Skip waiting to activate immediately
  self.skipWaiting();

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),

      // Cache offline page
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[Service Worker] Caching offline page');
        return cache.add('/offline');
      })
    ])
    .then(() => {
      console.log('[Service Worker] Installation complete');
    })
    .catch(error => {
      console.error('[Service Worker] Installation failed:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...');

  // Define caches to keep
  const currentCaches = [CACHE_NAME, STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];

  event.waitUntil(
    // Clean up old cache versions
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim();
      })
      .catch(error => {
        console.error('[Service Worker] Activation error:', error);
      })
  );
});

// Fetch event - implement stale-while-revalidate strategy for most requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Don't cache API requests except for specific public APIs
  if (url.pathname.startsWith('/api/') && !url.pathname.includes('/api/public/')) {
    return;
  }

  // Handle navigation requests - provide offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Check if we have a cached version
          return caches.match(request)
            .then(response => {
              if (response) {
                return response;
              }

              // If not, check if this is a page that should have a fallback
              if (OFFLINE_FALLBACK_PAGES.some(path => url.pathname.startsWith(path))) {
                return caches.match('/offline');
              }

              // Default fallback
              return caches.match('/offline');
            });
        })
    );
    return;
  }

  // For other requests, use stale-while-revalidate
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Return cached response immediately if available
        const fetchPromise = fetch(request)
          .then(networkResponse => {
            // Update cache with new response
            if (networkResponse && networkResponse.status === 200) {
              // Only cache same-origin and https resources
              const url = new URL(request.url);
              const isSameOrigin = url.origin === self.location.origin;
              const isHttps = url.protocol === 'https:' || url.protocol === 'http:';

              // Skip caching for chrome-extension and other non-standard protocols
              if (isSameOrigin || isHttps) {
                try {
                  const responseToCache = networkResponse.clone();
                  caches.open(DYNAMIC_CACHE_NAME)
                    .then(cache => {
                      cache.put(request, responseToCache);
                    })
                    .catch(error => {
                      console.error('[Service Worker] Cache update error:', error);
                    });
                } catch (error) {
                  console.error('[Service Worker] Error cloning response:', error);
                }
              }
            }
            return networkResponse;
          })
          .catch(error => {
            console.error('[Service Worker] Fetch error:', error);
            // If offline and no cached response, try to serve appropriate fallback
            if (!cachedResponse) {
              // For images, could return a placeholder
              if (request.destination === 'image') {
                return caches.match('/path/to/placeholder.png');
              }
            }
            throw error;
          });

        return cachedResponse || fetchPromise;
      })
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Sync', event);

  if (event.tag === 'attendance-sync') {
    console.log('[Service Worker] Syncing attendance records');
    event.waitUntil(syncAttendanceRecords());
  }

  if (event.tag === AUTO_CHECKOUT_SYNC_TAG) {
    console.log('[Service Worker] Performing auto-checkout check');
    event.waitUntil(checkForAutoCheckout());
  }
});

// Check if auto-checkout should be performed
async function checkForAutoCheckout() {
  try {
    // First check if we're online
    if (!self.navigator.onLine) {
      console.log('[Service Worker] Offline, skipping auto-checkout check');
      return;
    }

    // Check if the user is currently checked in and has auto-checkout enabled
    const response = await fetch('/api/attendance/auto-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (response.ok) {
      const data = await response.json();

      if (data.checked_out) {
        console.log('[Service Worker] Auto-checkout performed successfully');

        // Notify all clients
        notifyClients({
          type: 'AUTO_CHECKOUT_COMPLETED',
          checkOutTime: data.checkOutTime,
          totalHours: data.totalHours
        });
      } else if (data.next_checkout) {
        console.log('[Service Worker] Auto-checkout scheduled for later:', data.next_checkout);
      } else {
        console.log('[Service Worker] No auto-checkout needed');
      }
    } else {
      console.error('[Service Worker] Auto-checkout check failed:', await response.text());
    }
  } catch (error) {
    console.error('[Service Worker] Error checking for auto-checkout:', error);
  }
}

// Maximum number of sync retries
const MAX_SYNC_RETRIES = 5;

// Process the sync queue with improved error handling and retries
async function syncAttendanceRecords() {
  try {
    // Open the IndexedDB database
    const db = await openDatabase();
    const records = await getRecordsFromQueue(db);

    if (records.length === 0) {
      console.log('[Service Worker] No records to sync');
      return [];
    }

    console.log('[Service Worker] Records to sync:', records.length);

    // Sort records by timestamp to ensure proper order (check-ins before check-outs)
    records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Process each record
    const syncPromises = records.map(async (record) => {
      // Check if record has retry count, initialize if not
      record.retryCount = record.retryCount || 0;

      // Skip records that have exceeded max retries
      if (record.retryCount >= MAX_SYNC_RETRIES) {
        console.log(`[Service Worker] Record ${record.id} exceeded max retries, marking as failed`);

        // Notify the client about permanently failed record
        notifyClients({
          type: 'SYNC_PERMANENT_FAILURE',
          record: record,
          error: 'Exceeded maximum retry attempts'
        });

        // Remove from queue to prevent endless retries
        await removeRecordFromQueue(db, record.id);

        return {
          success: false,
          record,
          error: 'Exceeded maximum retry attempts',
          permanent: true
        };
      }

      try {
        // Determine the API endpoint based on the action type
        const endpoint = record.action === 'check-in'
          ? '/api/attendance/check-in'
          : '/api/attendance/check-out';

        // Add retry information to the request
        const requestData = {
          ...record.data,
          _syncMetadata: {
            originalTimestamp: record.timestamp,
            retryCount: record.retryCount,
            syncTimestamp: new Date().toISOString()
          }
        };

        // Send the request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          // If successful, remove from queue
          await removeRecordFromQueue(db, record.id);
          console.log(`[Service Worker] Successfully synced record ${record.id}`);

          // Notify the client
          notifyClients({
            type: 'SYNC_SUCCESS',
            record: record
          });

          return { success: true, record };
        } else {
          // Handle different error scenarios
          const errorData = await response.json();
          console.error(`[Service Worker] Failed to sync record ${record.id}:`, errorData);

          // Handle specific error cases
          if (errorData.error === "You are already checked in" ||
              errorData.error === "Already checked out" ||
              errorData.error === "No active check-in found") {
            // These are "success" errors - the state is already what we wanted
            await removeRecordFromQueue(db, record.id);

            notifyClients({
              type: 'SYNC_REDUNDANT',
              record: record,
              message: errorData.error
            });

            return { success: true, record, redundant: true, message: errorData.error };
          }

          // For server errors (5xx), increment retry count and keep in queue
          if (response.status >= 500) {
            // Update retry count
            record.retryCount++;
            await updateRecordInQueue(db, record);

            return {
              success: false,
              record,
              error: errorData.error || 'Server error',
              willRetry: true
            };
          }

          // For client errors (4xx) that aren't handled above, remove from queue
          // as they're likely to be permanent errors
          await removeRecordFromQueue(db, record.id);

          notifyClients({
            type: 'SYNC_FAILURE',
            record: record,
            error: errorData.error || 'Client error'
          });

          return {
            success: false,
            record,
            error: errorData.error || 'Client error',
            permanent: true
          };
        }
      } catch (error) {
        console.error(`[Service Worker] Error syncing record ${record.id}:`, error);

        // For network errors or timeouts, increment retry count
        if (error.name === 'AbortError' || error.name === 'TypeError' || error.message.includes('network')) {
          record.retryCount++;
          await updateRecordInQueue(db, record);

          return {
            success: false,
            record,
            error: 'Network error or timeout',
            willRetry: true
          };
        }

        // For other errors, remove from queue to prevent endless retries
        await removeRecordFromQueue(db, record.id);

        notifyClients({
          type: 'SYNC_FAILURE',
          record: record,
          error: error.message
        });

        return {
          success: false,
          record,
          error: error.message,
          permanent: true
        };
      }
    });

    // Wait for all sync operations to complete
    const results = await Promise.all(syncPromises);

    // Notify the client about the overall sync result
    notifyClients({
      type: 'SYNC_COMPLETED',
      results: results
    });

    // If there are still records to retry, register for another sync
    const remainingRecords = await getRecordsFromQueue(db);
    if (remainingRecords.length > 0) {
      console.log(`[Service Worker] ${remainingRecords.length} records still pending, registering for another sync`);

      // Schedule another sync after a delay
      setTimeout(() => {
        self.registration.sync.register('attendance-sync')
          .catch(err => console.error('[Service Worker] Failed to register for retry sync:', err));
      }, 60000); // 1 minute delay
    }

    return results;
  } catch (error) {
    console.error('[Service Worker] Error in syncAttendanceRecords:', error);
    throw error;
  }
}

// Helper function to notify all clients
function notifyClients(message) {
  self.clients.matchAll()
    .then(clients => {
      clients.forEach(client => {
        client.postMessage(message);
      });
    })
    .catch(err => {
      console.error('[Service Worker] Error notifying clients:', err);
    });
}

// IndexedDB functions
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('attendance-db', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(ATTENDANCE_SYNC_QUEUE)) {
        db.createObjectStore(ATTENDANCE_SYNC_QUEUE, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject('Error opening IndexedDB');
    };
  });
}

function getRecordsFromQueue(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ATTENDANCE_SYNC_QUEUE, 'readonly');
    const store = transaction.objectStore(ATTENDANCE_SYNC_QUEUE);
    const request = store.getAll();

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject('Error getting records from IndexedDB');
    };
  });
}

function removeRecordFromQueue(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ATTENDANCE_SYNC_QUEUE, 'readwrite');
    const store = transaction.objectStore(ATTENDANCE_SYNC_QUEUE);
    const request = store.delete(id);

    request.onsuccess = (event) => {
      resolve();
    };

    request.onerror = (event) => {
      reject('Error removing record from IndexedDB');
    };
  });
}

// Update a record in the queue (for retry counts)
function updateRecordInQueue(db, record) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ATTENDANCE_SYNC_QUEUE, 'readwrite');
    const store = transaction.objectStore(ATTENDANCE_SYNC_QUEUE);
    const request = store.put(record);

    request.onsuccess = (event) => {
      resolve();
    };

    request.onerror = (event) => {
      reject('Error updating record in IndexedDB');
    };
  });
}
