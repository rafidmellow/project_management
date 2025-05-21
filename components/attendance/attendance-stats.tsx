'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

export function AttendanceStats() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchAttendanceStats();
  }, [period]);

  const fetchAttendanceStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendance/stats?period=${period}`);
      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load attendance statistics',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error fetching attendance stats:', err);
      toast({
        title: 'Error',
        description: 'Failed to load attendance statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted/30 p-3 rounded-lg border">
        <h3 className="text-sm font-medium mb-3">Time Period</h3>
        <Tabs defaultValue="month" onValueChange={handlePeriodChange} className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="day" className="text-xs sm:text-sm">
              Today
            </TabsTrigger>
            <TabsTrigger value="week" className="text-xs sm:text-sm">
              This Week
            </TabsTrigger>
            <TabsTrigger value="month" className="text-xs sm:text-sm">
              This Month
            </TabsTrigger>
            <TabsTrigger value="year" className="text-xs sm:text-sm">
              This Year
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Mobile view - stacked cards */}
      <div className="grid gap-3 sm:hidden">
        <Card className="overflow-hidden">
          <div className="bg-black text-white p-3">
            <h3 className="text-sm font-medium">Field Attendance Summary</h3>
            <p className="text-xs text-white/70">
              {period === 'day'
                ? 'Today'
                : period === 'week'
                  ? 'This week'
                  : period === 'month'
                    ? 'This month'
                    : 'This year'}
            </p>
          </div>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <div className="text-xl font-bold">
                    {loading ? <Skeleton className="h-7 w-16" /> : `${stats?.totalHours || 0}h`}
                  </div>
                </div>
                <div className="bg-muted/30 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="text-sm text-muted-foreground">Average Daily</p>
                  <div className="text-xl font-bold">
                    {loading ? <Skeleton className="h-7 w-16" /> : `${stats?.averageHours || 0}h`}
                  </div>
                </div>
                <div className="bg-muted/30 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="text-sm text-muted-foreground">On-Time Rate</p>
                  <div className="text-xl font-bold">
                    {loading ? <Skeleton className="h-7 w-16" /> : `${stats?.onTimeRate || 0}%`}
                  </div>
                </div>
                <div className="bg-muted/30 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Attendance Days</p>
                  <div className="text-xl font-bold">
                    {loading ? (
                      <Skeleton className="h-7 w-16" />
                    ) : (
                      `${stats?.attendanceDays || 0}/${stats?.totalWorkingDays || 0}`
                    )}
                  </div>
                </div>
                <div className="bg-muted/30 p-2 rounded-full">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop view - grid cards */}
      <div className="hidden sm:grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-black/10 hover:border-black/20 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="mr-2 h-4 w-4 text-primary" />
              Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-20" /> : `${stats?.totalHours || 0}h`}
            </div>
            <p className="text-xs text-muted-foreground">
              {period === 'day'
                ? 'Today'
                : period === 'week'
                  ? 'This week'
                  : period === 'month'
                    ? 'This month'
                    : 'This year'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black/10 hover:border-black/20 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="mr-2 h-4 w-4 text-primary" />
              Average Daily
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-20" /> : `${stats?.averageHours || 0}h`}
            </div>
            <p className="text-xs text-muted-foreground">Per working day</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black/10 hover:border-black/20 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="mr-2 h-4 w-4 text-primary" />
              On-Time Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-20" /> : `${stats?.onTimeRate || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">Check-ins before 9 AM</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black/10 hover:border-black/20 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-primary" />
              Attendance Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                `${stats?.attendanceDays || 0}/${stats?.totalWorkingDays || 0}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.attendanceRate || 0}% attendance rate
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
