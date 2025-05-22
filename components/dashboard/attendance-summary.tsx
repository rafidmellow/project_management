'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, startOfWeek, endOfWeek, formatDistanceToNow, differenceInSeconds } from 'date-fns';
import { calculateTotalHours } from '@/lib/utils/date';
import { WORK_DAY } from '@/lib/constants/attendance';
import { AttendanceWithRelations, AttendanceStatistics } from '@/types/attendance';

interface AttendanceSummaryProps {
  period: 'today' | 'week' | 'month';
  title: string;
  subtitle?: string;
  className?: string;
}

// Dashboard-specific attendance data interface
interface AttendanceData {
  daysWorked: number;
  totalHours: number;
  avgHoursPerDay: number;
  attendanceRate?: number;
  currentStatus?: 'checked-in' | 'checked-out' | 'none';
  currentSessionStart?: string;
  hasActiveSession?: boolean;
}

export function AttendanceSummary({ period, title, subtitle, className }: AttendanceSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AttendanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Store raw data for timer updates
  const rawDataRef = useRef<{
    completedHours: number;
    activeSessionStart?: Date;
    hasActiveSession: boolean;
  }>({
    completedHours: 0,
    hasActiveSession: false,
  });

  // Timer for updating active session duration
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to update elapsed time for active sessions
  const updateElapsedTime = () => {
    if (!rawDataRef.current.hasActiveSession || !rawDataRef.current.activeSessionStart) return;

    const now = new Date();
    const sessionStart = new Date(rawDataRef.current.activeSessionStart);

    // Calculate elapsed hours with business rules
    const elapsedHours = calculateTotalHours(sessionStart, now, {
      maxHoursPerDay: WORK_DAY.MAX_HOURS_PER_DAY,
    });

    // Update total hours (completed hours + current session)
    const totalHours = rawDataRef.current.completedHours + elapsedHours;

    // Update the data state with new total hours
    setData(prevData => {
      if (!prevData) return null;
      return {
        ...prevData,
        totalHours: parseFloat(totalHours.toFixed(2)),
      };
    });
  };

  // Set up timer for active sessions
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Only set up timer for today's view with active session
    if (period === 'today' && rawDataRef.current.hasActiveSession) {
      timerRef.current = setInterval(updateElapsedTime, 30000); // Update every 30 seconds

      // Initial update
      updateElapsedTime();
    }

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [period, rawDataRef.current.hasActiveSession]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch data based on period
        let endpoint = '/api/attendance/current';
        if (period === 'week' || period === 'month') {
          endpoint = `/api/attendance/history?period=${period}`;
        }

        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`Failed to fetch ${period} attendance data`);

        const result = await response.json();

        // Process data based on period
        let processedData: AttendanceData = {
          daysWorked: 0,
          totalHours: 0,
          avgHoursPerDay: 0,
        };

        if (period === 'today') {
          // Use the new API response format
          const attendance = (result.currentAttendance ||
            result.attendance) as AttendanceWithRelations | null;
          const totalHoursToday =
            result.totalHoursToday !== undefined
              ? result.totalHoursToday
              : attendance?.totalHours || 0;
          const hasActiveSession =
            result.hasActiveSession || (attendance && !attendance.checkOutTime);

          processedData = {
            daysWorked: attendance ? 1 : 0,
            totalHours: totalHoursToday,
            avgHoursPerDay: totalHoursToday,
            currentStatus: attendance
              ? attendance.checkOutTime
                ? 'checked-out'
                : 'checked-in'
              : 'none',
            currentSessionStart: attendance?.checkInTime as string | undefined,
            hasActiveSession,
          };

          // Store raw data for timer updates
          rawDataRef.current = {
            completedHours:
              totalHoursToday -
              (hasActiveSession && attendance
                ? calculateTotalHours(new Date(attendance.checkInTime), new Date(), {
                    maxHoursPerDay: WORK_DAY.MAX_HOURS_PER_DAY,
                  })
                : 0),
            activeSessionStart:
              hasActiveSession && attendance ? new Date(attendance.checkInTime) : undefined,
            hasActiveSession,
          };

          // Handle case when attendance is null
          if (!attendance) {
            processedData = {
              daysWorked: 0,
              totalHours: 0,
              avgHoursPerDay: 0,
              currentStatus: 'none',
              currentSessionStart: undefined,
              hasActiveSession: false,
            };

            rawDataRef.current = {
              completedHours: 0,
              hasActiveSession: false,
            };
          }
        } else {
          // For week or month
          const records = result.attendanceRecords || ([] as AttendanceWithRelations[]);

          if (records.length === 0) {
            processedData = {
              daysWorked: 0,
              totalHours: 0,
              avgHoursPerDay: 0,
            };

            // Add attendance rate for month
            if (period === 'month') {
              processedData.attendanceRate = 0;
            }
          } else {
            const uniqueDays = new Set(
              records.map((r: AttendanceWithRelations) => new Date(r.checkInTime).toDateString())
            ).size;

            const totalHours = records.reduce(
              (sum: number, r: AttendanceWithRelations) => sum + (r.totalHours || 0),
              0
            );

            processedData = {
              daysWorked: uniqueDays,
              totalHours: parseFloat(totalHours.toFixed(2)),
              avgHoursPerDay: uniqueDays > 0 ? parseFloat((totalHours / uniqueDays).toFixed(2)) : 0,
            };

            // Add attendance rate for month
            if (period === 'month') {
              const workingDaysPerMonth = 22; // Approximate
              processedData.attendanceRate = parseFloat(
                ((uniqueDays / workingDaysPerMonth) * 100).toFixed(2)
              );
            }
          }
        }

        setData(processedData);
      } catch (err) {
        console.error(`Error fetching ${period} attendance data:`, err);
        setError(`Failed to load ${period} attendance data`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  // Generate subtitle if not provided
  const generatedSubtitle = () => {
    if (subtitle) return subtitle;

    if (period === 'today') {
      return format(new Date(), 'EEEE, MMMM d, yyyy');
    } else if (period === 'week') {
      const now = new Date();
      return `${format(startOfWeek(now), 'MMM d')} - ${format(endOfWeek(now), 'MMM d, yyyy')}`;
    } else {
      return format(new Date(), 'MMMM yyyy');
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription className="text-xs">{generatedSubtitle()}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : (
          <div className="space-y-2">
            {period === 'today' && (
              <div className="flex justify-between items-center flex-wrap gap-1">
                <span className="text-xs font-medium">Status:</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    data?.currentStatus === 'checked-in'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {data?.currentStatus === 'checked-in'
                    ? 'Checked In'
                    : data?.currentStatus === 'checked-out'
                      ? 'Checked Out'
                      : 'Not Checked In'}
                </span>
              </div>
            )}

            {period === 'today' && data?.currentStatus === 'checked-in' && (
              <div className="flex justify-between items-center flex-wrap gap-1">
                <span className="text-xs font-medium">Current Session:</span>
                <span className="text-xs flex items-center">
                  {data?.currentSessionStart ? (
                    <>
                      {formatDistanceToNow(new Date(data.currentSessionStart), { addSuffix: true })}
                      <span className="ml-1 relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                    </>
                  ) : (
                    'N/A'
                  )}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center flex-wrap gap-1">
              <span className="text-xs font-medium">
                {period === 'today' ? 'Hours Today:' : 'Total Hours:'}
              </span>
              <span className="text-xs flex items-center">
                {data?.totalHours.toFixed(2)} hrs
                {period === 'today' && data?.hasActiveSession && (
                  <span className="ml-1 text-xs text-green-600">(updating)</span>
                )}
              </span>
            </div>

            {period !== 'today' && (
              <div className="flex justify-between items-center flex-wrap gap-1">
                <span className="text-xs font-medium">Days Present:</span>
                <span className="text-xs">
                  {data?.daysWorked} {period === 'week' ? '/ 5' : ''} days
                </span>
              </div>
            )}

            {period !== 'today' && (
              <div className="flex justify-between items-center flex-wrap gap-1">
                <span className="text-xs font-medium">Daily Average:</span>
                <span className="text-xs">{data?.avgHoursPerDay} hrs/day</span>
              </div>
            )}

            {period === 'month' && data?.attendanceRate !== undefined && (
              <div className="flex justify-between items-center flex-wrap gap-1">
                <span className="text-xs font-medium">Attendance Rate:</span>
                <span className="text-xs">{data.attendanceRate}%</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
