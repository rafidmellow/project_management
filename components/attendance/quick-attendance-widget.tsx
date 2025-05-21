'use client';

import { useState, useEffect, useCallback } from 'react';
import { LogIn, LogOut, Clock, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

export function QuickAttendanceWidget() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  // Basic state
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Fetch attendance data
  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attendance/current');
      const data = await response.json();

      if (response.ok) {
        setCurrentAttendance(data.attendance);
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

  // Simple online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "You're back online",
        description: 'Your attendance data will now sync.',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're offline",
        description: "Attendance actions will be saved and synced when you're back online.",
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Handle check-in
  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      setError(null);

      // Get current position
      const position = await getCurrentPosition();

      // Prepare check-in data
      const checkInData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: new Date().toISOString(),
      };

      // Online mode - send request directly
      const response = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkInData),
      });

      const data = await response.json();

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

      // Get current position
      const position = await getCurrentPosition();

      // Prepare check-out data
      const checkOutData = {
        attendanceId: currentAttendance.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: new Date().toISOString(),
      };

      // Online mode - send request directly
      const response = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkOutData),
      });

      const data = await response.json();

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
              <CardTitle className="text-base font-medium">Attendance</CardTitle>
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="p-4">
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
            <CardTitle className="text-base font-medium">Attendance</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
              >
                Offline
              </Badge>
            )}
            {currentAttendance && !currentAttendance.checkOutTime ? (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200 text-xs"
              >
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
                Inactive
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-xs flex items-center gap-2 border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Current Status */}
        <div className="mb-4">
          {currentAttendance && !currentAttendance.checkOutTime ? (
            <div className="text-sm">
              <span className="font-medium">Currently Checked In</span>
              <div className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(currentAttendance.checkInTime), { addSuffix: true })}
              </div>
            </div>
          ) : (
            <div className="text-sm">
              {currentAttendance ? (
                <>
                  <span className="font-medium">Last Session</span>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(
                      new Date(currentAttendance.checkOutTime || currentAttendance.checkInTime),
                      { addSuffix: true }
                    )}
                  </div>
                </>
              ) : (
                <span>You haven't checked in today</span>
              )}
            </div>
          )}
        </div>

        {/* Check In/Out Button */}
        <div className="flex justify-between items-center">
          <div>
            {currentAttendance && !currentAttendance.checkOutTime ? (
              <Button
                onClick={handleCheckOut}
                disabled={checkingOut}
                className="bg-black hover:bg-black/90 text-white"
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
                className="bg-black hover:bg-black/90 text-white"
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/attendance/dashboard')}
            className="text-xs"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
