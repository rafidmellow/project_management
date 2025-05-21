'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceWidget } from '@/components/attendance/attendance-widget';
import { AttendanceSummary } from '@/components/dashboard/attendance-summary';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatDistanceToNow,
  format,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  differenceInHours,
  addDays,
} from 'date-fns';

interface AttendanceRecord {
  id: string;
  checkInTime: string;
  checkOutTime: string | null;
  totalHours: number | null;
  notes: string | null;
  project?: {
    id: string;
    title?: string;
    name?: string;
  } | null;
  task?: {
    id: string;
    title: string;
  } | null;
}

export default function AttendanceDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoading(true);

        // Fetch recent attendance data
        const response = await fetch('/api/attendance/history?period=week&limit=5');
        if (!response.ok) throw new Error('Failed to fetch recent attendance');
        const data = await response.json();
        setRecentAttendance(data.attendanceRecords || []);
      } catch (err) {
        console.error('Error fetching recent attendance data:', err);
        setError('Failed to load recent activity. Please try again later.');
        setRecentAttendance([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Attendance Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage your attendance</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Attendance Widget */}
        <AttendanceWidget />

        {/* Summary Cards */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {/* Today's Overview */}
          <AttendanceSummary period="today" title="Today's Overview" />

          {/* This Week */}
          <AttendanceSummary period="week" title="This Week" />

          {/* This Month */}
          <AttendanceSummary
            period="month"
            title="This Month"
            className="sm:col-span-2 lg:col-span-1"
          />
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
            <CardDescription className="text-xs">Your latest attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1 min-w-0">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-[80%]" />
                      <Skeleton className="h-3 w-[60%]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-6 text-destructive text-sm">{error}</div>
            ) : recentAttendance.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No recent attendance records found
              </div>
            ) : (
              <div className="space-y-4">
                {recentAttendance.map(record => (
                  <div
                    key={record.id}
                    className="flex items-start gap-3 border-b pb-3 last:border-0"
                  >
                    <div className="bg-primary/10 p-2 rounded-full shrink-0">
                      <div className="h-4 w-4 rounded-full bg-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">
                        {record.checkOutTime ? 'Completed Work Session' : 'Started Work Session'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {format(new Date(record.checkInTime), 'EEEE, MMMM d • h:mm a')}
                        {record.checkOutTime &&
                          ` - ${format(new Date(record.checkOutTime), 'h:mm a')}`}
                      </div>
                      {record.totalHours && (
                        <div className="text-xs mt-1">
                          Duration: {record.totalHours.toFixed(2)} hours
                        </div>
                      )}
                      {record.project && (
                        <div className="text-xs mt-1 truncate">
                          Project: {record.project.title || record.project.name}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="text-center pt-2">
                  <button
                    onClick={() => router.push('/attendance')}
                    className="text-xs text-primary hover:underline"
                  >
                    View all attendance records
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
