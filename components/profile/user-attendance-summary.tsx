'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import { format, formatDistance } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AttendanceWithRelations, AttendanceSummary } from '@/types/attendance';

// Extended summary interface with additional fields needed for this component
interface ExtendedAttendanceSummary extends AttendanceSummary {
  averageHoursPerDay?: number;
  firstCheckIn?: string | null;
  lastCheckOut?: string | null;
  lastCheckIn?: string | null;
  autoCheckoutCount?: number;
}

interface UserAttendanceSummaryProps {
  userId: string;
}

export function UserAttendanceSummary({ userId }: UserAttendanceSummaryProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceWithRelations[]>([]);
  const [summary, setSummary] = useState<ExtendedAttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('recent');

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setIsLoading(true);
        setIsError(false);
        setErrorMessage('');

        console.log(`Fetching attendance for user ${userId}`);
        const response = await fetch(`/api/users/${userId}/attendance?limit=5`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API returned status ${response.status}`);
        }

        const data = await response.json();
        console.log('Attendance data:', data);

        // Set attendance records with safety checks
        if (Array.isArray(data.attendanceRecords)) {
          setAttendanceRecords(data.attendanceRecords);
        } else {
          console.warn('No attendance records array found in response', data);
          setAttendanceRecords([]);
        }

        // Set summary with safety checks
        if (data.summary && typeof data.summary === 'object') {
          setSummary(data.summary);
        } else {
          console.warn('No valid summary object found in response', data);
          setSummary({
            totalRecords: 0,
            totalHours: 0,
            userCount: 0,
            averageHoursPerDay: 0,
          });
        }
      } catch (error: any) {
        console.error('Error fetching attendance:', error);
        setIsError(true);
        setErrorMessage(error?.message || 'Failed to load attendance data');

        // Set empty data on error to prevent UI from breaking
        setAttendanceRecords([]);
        setSummary({
          totalRecords: 0,
          totalHours: 0,
          userCount: 0,
          averageHoursPerDay: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchAttendance();
    }
  }, [userId]);

  // Get the current month name
  const currentMonthName = format(new Date(), 'MMMM');

  // Safely format date with fallback
  const safeFormat = (
    dateString: string | null | undefined,
    formatString: string = 'MMM d, yyyy'
  ) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), formatString);
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'Invalid date';
    }
  };

  const renderErrorState = () => (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {errorMessage || 'Failed to load attendance data. Please try again later.'}
      </AlertDescription>
    </Alert>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {isError && renderErrorState()}

        <Tabs defaultValue="recent" onValueChange={setActiveTab}>
          <TabsList className="flex w-full">
            <TabsTrigger value="recent" className="flex-1">
              Recent Activity
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex-1">
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4 pt-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No attendance records found
              </div>
            ) : (
              <div className="space-y-4">
                {attendanceRecords.map(record => (
                  <div key={record.id} className="border-b pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {safeFormat(typeof record.checkInTime === 'string' ? record.checkInTime : record.checkInTime.toISOString(), 'EEEE, MMMM d, yyyy')}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {safeFormat(typeof record.checkInTime === 'string' ? record.checkInTime : record.checkInTime.toISOString(), 'h:mm a')} -
                          {record.checkOutTime
                            ? safeFormat(typeof record.checkOutTime === 'string' ? record.checkOutTime : record.checkOutTime.toISOString(), ' h:mm a')
                            : ' Present'}
                        </div>
                        {record.checkInLocationName && (
                          <div className="text-sm text-muted-foreground flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {record.checkInLocationName}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {record.totalHours
                            ? `${Number(record.totalHours).toFixed(1)} hrs`
                            : 'Active'}
                        </div>
                        {record.project && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {record.project.title}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {summary && summary.totalRecords > 5 && (
                  <div className="text-center pt-2">
                    <Button variant="link" asChild>
                      <a href={`/attendance/user/${userId}`}>
                        View all {summary.totalRecords} records
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="pt-4">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : !summary ? (
              <div className="text-center py-4 text-muted-foreground">
                No attendance statistics available
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border rounded-md p-4 text-center">
                  <div className="text-2xl font-bold">{Number(summary.totalHours).toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Total Hours</div>
                </div>
                <div className="border rounded-md p-4 text-center">
                  <div className="text-2xl font-bold">{summary.totalRecords}</div>
                  <div className="text-sm text-muted-foreground">Total Check-ins</div>
                </div>
                <div className="border rounded-md p-4 text-center">
                  <div className="text-2xl font-bold">
                    {summary.lastCheckIn ? safeFormat(summary.lastCheckIn, 'MMM d') : 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">Last Check-in</div>
                </div>
                <div className="border rounded-md p-4 text-center">
                  <div className="text-2xl font-bold">
                    {summary.averageHoursPerDay
                      ? Number(summary.averageHoursPerDay).toFixed(1)
                      : '0.0'}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Hours/Day</div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
