'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  MapPin,
  LogIn,
  LogOut,
  Info,
  ExternalLink,
  Calendar,
  CheckCircle,
  AlertCircle,
  WifiOff,
  RefreshCw,
  CloudOff,
  Cloud,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { getDeviceInfo } from '@/lib/utils/geo-utils';
import { LocationMap } from '@/components/attendance/location-map';
import {
  registerServiceWorker,
  registerBackgroundSync,
  isBackgroundSyncSupported,
  listenForServiceWorkerMessages,
} from '@/lib/service-worker';
import { addToSyncQueue, getSyncQueue, removeFromSyncQueue } from '@/lib/indexed-db';
import {
  Attendance,
  AttendanceWithRelations,
  AttendanceCheckInDTO,
  AttendanceCheckOutDTO,
  AttendanceResponse,
} from '@/types/attendance';

export function AttendanceWidget() {
  const { data: session } = useSession();
  const { toast } = useToast();

  // Basic state
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceWithRelations | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncSupported, setSyncSupported] = useState(false);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Fetch attendance data
  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attendance/current');
      const data = await response.json();

      if (response.ok) {
        // Use currentAttendance from the new API response format, falling back to attendance for backward compatibility
        const attendanceData: AttendanceWithRelations = data.currentAttendance || data.attendance;
        setCurrentAttendance(attendanceData);
        setError(null);
      } else {
        setError(data.error || 'Failed to load attendance data');
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load attendance data on mount
  useEffect(() => {
    if (session?.user?.id) {
      fetchAttendance();
    }
  }, [session?.user?.id, fetchAttendance]);

  // Initialize service worker and background sync
  useEffect(() => {
    const initServiceWorker = async () => {
      try {
        // Register service worker
        const registered = await registerServiceWorker();

        // Check if background sync is supported
        const syncSupported = isBackgroundSyncSupported();
        setSyncSupported(syncSupported);

        if (registered && syncSupported) {
          // Register for background sync
          await registerBackgroundSync();
          console.log('Background sync registered successfully');
        }

        // Load pending actions from IndexedDB
        const queue = await getSyncQueue();
        setPendingActions(queue);
      } catch (error) {
        console.error('Error initializing service worker:', error);
      }
    };

    initServiceWorker();
  }, []);

  // Listen for service worker messages with enhanced handling
  useEffect(() => {
    const cleanup = listenForServiceWorkerMessages(data => {
      console.log('Service worker message received:', data.type);

      switch (data.type) {
        case 'SYNC_SUCCESS':
          console.log('Sync success:', data.record);
          // Refresh attendance data after successful sync
          fetchAttendance();
          break;

        case 'SYNC_REDUNDANT':
          console.log('Sync redundant:', data.record, data.message);
          // This is a "success" case where the server state already matches what we wanted
          toast({
            title: 'Already Synchronized',
            description: data.message || 'Your attendance record was already up to date.',
          });
          // Refresh data and pending actions
          fetchAttendance();
          getSyncQueue().then(queue => setPendingActions(queue));
          break;

        case 'SYNC_FAILURE':
          console.log('Sync failure:', data.record, data.error);
          toast({
            title: 'Sync Failed',
            description: data.error || 'Failed to sync attendance record.',
            variant: 'destructive',
          });
          // Refresh pending actions
          getSyncQueue().then(queue => setPendingActions(queue));
          break;

        case 'SYNC_PERMANENT_FAILURE':
          console.log('Sync permanent failure:', data.record, data.error);
          toast({
            title: 'Sync Failed Permanently',
            description: `An attendance record could not be synced after multiple attempts: ${data.error}`,
            variant: 'destructive',
          });
          // Refresh pending actions
          getSyncQueue().then(queue => setPendingActions(queue));
          break;

        case 'SYNC_COMPLETED':
          console.log('Sync completed:', data.results);
          setSyncInProgress(false);

          // Refresh pending actions
          getSyncQueue().then(queue => {
            setPendingActions(queue);
          });

          // Count different result types
          const successCount =
            data.results?.filter((r: any) => r.success && !r.redundant).length || 0;
          const redundantCount = data.results?.filter((r: any) => r.redundant).length || 0;
          const retryCount = data.results?.filter((r: any) => r.willRetry).length || 0;
          const failureCount = data.results?.filter((r: any) => r.permanent).length || 0;

          // Show appropriate toast notification
          if (successCount > 0 || redundantCount > 0) {
            let description = '';

            if (successCount > 0) {
              description += `Successfully synced ${successCount} ${successCount === 1 ? 'record' : 'records'}. `;
            }

            if (redundantCount > 0) {
              description += `${redundantCount} ${redundantCount === 1 ? 'record was' : 'records were'} already up to date. `;
            }

            if (retryCount > 0) {
              description += `${retryCount} ${retryCount === 1 ? 'record' : 'records'} will be retried. `;
            }

            if (failureCount > 0) {
              description += `${failureCount} ${failureCount === 1 ? 'record' : 'records'} failed permanently.`;
            }

            toast({
              title: 'Sync Completed',
              description: description.trim(),
            });
          } else if (retryCount > 0) {
            toast({
              title: 'Sync Incomplete',
              description: `${retryCount} ${retryCount === 1 ? 'record' : 'records'} will be retried when connection improves.`,
              variant: 'default',
            });
          } else if (failureCount > 0) {
            toast({
              title: 'Sync Failed',
              description: `${failureCount} ${failureCount === 1 ? 'record' : 'records'} could not be synchronized.`,
              variant: 'destructive',
            });
          }

          // Refresh attendance data
          fetchAttendance();
          break;

        default:
          console.log('Unknown message type:', data.type, data);
      }
    });

    return cleanup;
  }, [fetchAttendance, toast]);

  // Simple online/offline detection
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      toast({
        title: "You're back online",
        description: 'Your attendance data will now sync.',
      });

      // Trigger background sync when back online
      if (syncSupported) {
        setSyncInProgress(true);
        try {
          await registerBackgroundSync();
        } catch (error) {
          console.error('Error registering background sync:', error);
          setSyncInProgress(false);
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're offline",
        description: "Attendance actions will be saved and synced when you're back online.",
        variant: 'destructive',
      });
    };

    // Load pending actions on mount
    getSyncQueue().then(queue => {
      setPendingActions(queue);
    });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle check-in
  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      setError(null);

      // Get current position
      const position = await getCurrentPosition();

      // Prepare check-in data
      const checkInData: AttendanceCheckInDTO = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        notes: undefined,
      };

      if (isOnline) {
        // Online mode - send request directly
        const response = await fetch('/api/attendance/check-in', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(checkInData),
        });

        const data: AttendanceResponse = await response.json();

        if (response.ok) {
          setCurrentAttendance(data.attendance);
          toast({
            title: 'Checked In',
            description: 'Your attendance has been recorded successfully.',
          });
        } else {
          setError(data.error || 'Failed to check in');
          toast({
            title: 'Check-in Failed',
            description: data.error || 'Failed to check in. Please try again.',
            variant: 'destructive',
          });
        }
      } else {
        // Offline mode - save to IndexedDB for background sync
        const record = await addToSyncQueue({
          action: 'check-in',
          timestamp: new Date().toISOString(),
          data: checkInData,
        });

        // Update pending actions
        const queue = await getSyncQueue();
        setPendingActions(queue);

        // Create temporary attendance record for UI
        const tempAttendance: AttendanceWithRelations = {
          id: `temp-${Date.now()}`,
          userId: session?.user?.id || '',
          checkInTime: new Date().toISOString(),
          checkInLatitude: position.coords.latitude,
          checkInLongitude: position.coords.longitude,
          checkInLocationName: 'Location will be updated when online',
          checkOutTime: null,
          autoCheckout: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pendingSync: true,
        };

        setCurrentAttendance(tempAttendance);

        toast({
          title: 'Checked In (Offline)',
          description: "Your check-in has been saved and will sync when you're back online.",
        });

        // Register for background sync if supported
        if (syncSupported) {
          try {
            await registerBackgroundSync();
          } catch (error) {
            console.error('Error registering background sync:', error);
          }
        }
      }
    } catch (err: any) {
      console.error('Check-in error:', err);
      setError(err.message || 'Failed to check in. Please try again.');
      toast({
        title: 'Check-in Failed',
        description: err.message || 'Failed to check in. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCheckingIn(false);
    }
  };

  // Handle check-out
  const handleCheckOut = async () => {
    try {
      setCheckingOut(true);
      setError(null);

      if (!currentAttendance) {
        setError('No active check-in found');
        toast({
          title: 'Check-out Failed',
          description: 'No active check-in found. Please check in first.',
          variant: 'destructive',
        });
        return;
      }

      // Skip if it's a temporary attendance record (not yet synced)
      if (currentAttendance.id.startsWith('temp-') && !isOnline) {
        setError('Cannot check out from a temporary check-in');
        toast({
          title: 'Check-out Failed',
          description: 'Your check-in is still pending sync. Please try again when online.',
          variant: 'destructive',
        });
        return;
      }

      // Get current position
      const position = await getCurrentPosition();

      // Prepare check-out data
      const checkOutData: AttendanceCheckOutDTO = {
        attendanceId: currentAttendance.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        notes: undefined,
      };

      if (isOnline) {
        // Online mode - send request directly
        const response = await fetch('/api/attendance/check-out', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(checkOutData),
        });

        const data: AttendanceResponse = await response.json();

        if (response.ok) {
          setCurrentAttendance(data.attendance);
          toast({
            title: 'Checked Out',
            description: 'Your check-out has been recorded successfully.',
          });
        } else {
          setError(data.error || 'Failed to check out');
          toast({
            title: 'Check-out Failed',
            description: data.error || 'Failed to check out. Please try again.',
            variant: 'destructive',
          });
        }
      } else {
        // Offline mode - save to IndexedDB for background sync
        await addToSyncQueue({
          action: 'check-out',
          timestamp: new Date().toISOString(),
          data: checkOutData,
        });

        // Update pending actions
        const queue = await getSyncQueue();
        setPendingActions(queue);

        // Create temporary updated attendance record for UI
        const tempAttendance: AttendanceWithRelations = {
          ...currentAttendance,
          checkOutTime: new Date().toISOString(),
          checkOutLatitude: position.coords.latitude,
          checkOutLongitude: position.coords.longitude,
          checkOutLocationName: 'Location will be updated when online',
          pendingSync: true,
          // Estimate total hours
          totalHours:
            (new Date().getTime() - new Date(currentAttendance.checkInTime).getTime()) /
            (1000 * 60 * 60),
          updatedAt: new Date().toISOString(),
        };

        setCurrentAttendance(tempAttendance);

        toast({
          title: 'Checked Out (Offline)',
          description: "Your check-out has been saved and will sync when you're back online.",
        });

        // Register for background sync if supported
        if (syncSupported) {
          try {
            await registerBackgroundSync();
          } catch (error) {
            console.error('Error registering background sync:', error);
          }
        }
      }
    } catch (err: any) {
      console.error('Check-out error:', err);
      setError(err.message || 'Failed to check out. Please try again.');
      toast({
        title: 'Check-out Failed',
        description: err.message || 'Failed to check out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCheckingOut(false);
    }
  };

  // Get current position
  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => {
          console.error('Geolocation error:', error);

          // Handle specific geolocation errors with more helpful messages
          if (error.code === 1) {
            // Permission denied
            reject(
              new Error(
                'Location permission denied. Please enable location services in your browser settings.'
              )
            );
          } else if (error.code === 2) {
            // Position unavailable
            reject(
              new Error('Unable to determine your location. Please try again in a different area.')
            );
          } else if (error.code === 3) {
            // Timeout
            reject(
              new Error('Location request timed out. Please check your connection and try again.')
            );
          } else {
            reject(new Error('Unable to retrieve your location. Please enable location services.'));
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  };

  // Loading state
  if (loading) {
    return (
      <Card className="overflow-hidden border shadow-md">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-primary" />
              <CardTitle className="text-base font-medium">Field Attendance</CardTitle>
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-4">
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>

          <div className="flex justify-center mt-2">
            <Skeleton className="h-10 w-full sm:w-32 rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render component
  return (
    <Card className="overflow-hidden border shadow-md">
      <CardHeader className="pb-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-primary" />
            <CardTitle className="text-base font-medium">Field Attendance</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1"
              >
                <WifiOff className="h-3 w-3" /> Offline
              </Badge>
            )}
            {currentAttendance && !currentAttendance.checkOutTime ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                Inactive
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Offline Queue Indicator */}
        {pendingActions.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 text-amber-800 rounded-md text-xs flex items-center justify-between gap-2 border border-amber-200">
            <div className="flex items-center gap-2">
              <CloudOff className="h-4 w-4 shrink-0" />
              <span>
                {pendingActions.length} pending {pendingActions.length === 1 ? 'action' : 'actions'}{' '}
                to sync
              </span>
            </div>
            {isOnline && !syncInProgress && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-white"
                onClick={async () => {
                  setSyncInProgress(true);
                  try {
                    await registerBackgroundSync();
                    // Wait a bit to show the syncing state
                    setTimeout(() => {
                      setSyncInProgress(false);
                    }, 2000);
                  } catch (error) {
                    console.error('Error registering background sync:', error);
                    setSyncInProgress(false);
                  }
                }}
              >
                <Cloud className="h-3 w-3 mr-1" />
                Sync Now
              </Button>
            )}
            {syncInProgress && (
              <div className="flex items-center gap-1 text-xs">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Syncing...</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-xs flex items-center gap-2 border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Current Status */}
        <div className="mb-4">
          {currentAttendance && !currentAttendance.checkOutTime ? (
            <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-3 shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Currently Checked In</div>
                    {currentAttendance.pendingSync && (
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                      >
                        Pending Sync
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(currentAttendance.checkInTime), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted/30 p-3 rounded-lg border">
              {currentAttendance ? (
                <div className="flex items-center">
                  <div className="bg-muted/50 p-2 rounded-full mr-3 shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Checked Out</div>
                      {currentAttendance.pendingSync && (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                        >
                          Pending Sync
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Last session:{' '}
                      {formatDistanceToNow(
                        new Date(currentAttendance.checkOutTime || currentAttendance.checkInTime),
                        { addSuffix: true }
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="bg-muted/50 p-2 rounded-full mr-3 shrink-0">
                    <Info className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm">You haven't checked in today</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Location Information (only shown when checked in) */}
        {currentAttendance && !currentAttendance.checkOutTime && (
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <MapPin className="h-4 w-4 mr-2 text-primary" />
              <h3 className="text-sm font-medium">Current Location</h3>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-medium">
                {currentAttendance.checkInLocationName || 'Location name not available'}
              </div>

              {/* Map */}
              {currentAttendance.checkInLatitude && currentAttendance.checkInLongitude && (
                <div className="relative border rounded-lg overflow-hidden shadow-xs">
                  <LocationMap
                    latitude={currentAttendance.checkInLatitude}
                    longitude={currentAttendance.checkInLongitude}
                    className="h-[150px] w-full"
                  />
                  <div className="absolute bottom-0 right-0 p-1.5 bg-background/90 text-xs rounded-tl-md backdrop-blur-xs">
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${currentAttendance.checkInLatitude}&mlon=${currentAttendance.checkInLongitude}#map=16/${currentAttendance.checkInLatitude}/${currentAttendance.checkInLongitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      View larger map <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Check In/Out Button */}
        <div className="flex justify-center mt-2">
          {currentAttendance && !currentAttendance.checkOutTime ? (
            <Button
              onClick={handleCheckOut}
              disabled={checkingOut}
              className="w-full sm:w-auto bg-black hover:bg-black/90 text-white"
            >
              {checkingOut ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Check Out
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="w-full sm:w-auto bg-black hover:bg-black/90 text-white"
            >
              {checkingIn ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Check In
                </>
              )}
            </Button>
          )}
        </div>

        {!isOnline && (
          <div className="mt-4 pt-3 border-t text-center">
            <p className="text-xs text-muted-foreground">
              You are currently offline. Your attendance actions will be saved and synced when
              you're back online.
            </p>
          </div>
        )}

        {syncSupported && typeof window !== 'undefined' && (
          <div className="mt-4 pt-3 border-t text-center">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Cloud className="h-3 w-3" />
              Background sync enabled
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
