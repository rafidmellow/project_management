'use client';

import { useState, useEffect, useCallback } from 'react';
import { LogIn, LogOut, Clock, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { checkOutAndLogout } from '@/lib/logout-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AttendanceWithRelations,
  AttendanceCheckInDTO,
  AttendanceCheckOutDTO,
  AttendanceResponse,
} from '@/types/attendance';

export function TopCornerAttendance() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  // Basic state
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceWithRelations | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Fetch attendance data
  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attendance/current');
      const data: AttendanceResponse = await response.json();

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
      const checkInData: AttendanceCheckInDTO = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

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
      const checkOutData: AttendanceCheckOutDTO = {
        attendanceId: currentAttendance.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

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
      <div className="flex items-center gap-1 sm:gap-2">
        <Skeleton className="h-8 w-20 sm:h-9 sm:w-24 rounded-md" />
      </div>
    );
  }

  // Render component
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {/* Status indicator - hidden on very small screens */}
      <div className="hidden xs:block">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
              <span className="sr-only">Attendance Status</span>
              <div className="relative">
                <Clock className="h-4 w-4" />
                {currentAttendance && !currentAttendance.checkOutTime && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500" />
                )}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Attendance Status</h4>
              {currentAttendance && !currentAttendance.checkOutTime ? (
                <div className="text-xs">
                  <div className="flex items-center gap-1">
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200 text-xs"
                    >
                      Active
                    </Badge>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(currentAttendance.checkInTime), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="mt-2 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/attendance/dashboard')}
                      className="text-xs w-full"
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => checkOutAndLogout()}
                      className="text-xs w-full text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Check Out & Logout
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-xs">
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
                      Inactive
                    </Badge>
                    {currentAttendance && (
                      <span className="text-muted-foreground">
                        Last session:{' '}
                        {formatDistanceToNow(
                          new Date(currentAttendance.checkOutTime || currentAttendance.checkInTime),
                          { addSuffix: true }
                        )}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/attendance/dashboard')}
                      className="text-xs w-full"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Check In/Out Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {currentAttendance && !currentAttendance.checkOutTime ? (
              <Button
                onClick={handleCheckOut}
                disabled={checkingOut}
                className="bg-black hover:bg-black/90 text-white h-8 sm:h-9 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3"
                size="sm"
              >
                {checkingOut ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 mr-1 sm:mr-2 shrink-0"
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
                    <span className="truncate">Processing...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="mr-1 sm:mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">Check Out</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="bg-black hover:bg-black/90 text-white h-8 sm:h-9 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3"
                size="sm"
              >
                {checkingIn ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 mr-1 sm:mr-2 shrink-0"
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
                    <span className="truncate">Processing...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="mr-1 sm:mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">Check In</span>
                  </>
                )}
              </Button>
            )}
          </TooltipTrigger>
          <TooltipContent>
            {currentAttendance && !currentAttendance.checkOutTime
              ? 'Record your check-out time'
              : 'Start your work session'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
