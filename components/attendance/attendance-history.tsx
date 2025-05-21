'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Info,
  ExternalLink,
  MoreHorizontal,
} from 'lucide-react';
import { startOfWeek, endOfWeek } from 'date-fns';
import { getDeviceInfo } from '@/lib/geo-utils';
import { LocationMap } from '@/components/attendance/location-map';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { formatDate, calculateDuration } from '@/lib/utils/date';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CorrectionRequestDialog } from '@/components/attendance/correction-request-dialog';
import {
  AttendanceWithRelations,
  AttendanceGroup,
  AttendanceHistoryResponse,
  AttendanceFilterOptions,
} from '@/types/attendance';

export function AttendanceHistory() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceWithRelations[]>([]);
  const [groupedRecords, setGroupedRecords] = useState<AttendanceGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceWithRelations | null>(null);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | null>(null);

  useEffect(() => {
    fetchAttendanceHistory();
  }, [page, groupBy]);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      let url = `/api/attendance/history?page=${page}&limit=10`;
      if (groupBy) {
        url += `&groupBy=${groupBy}`;
      }

      // First, clear any previous data
      if (groupBy) {
        // When using groupBy, we'll primarily use groupedRecords
        setGroupedRecords([]);
      } else {
        // When not using groupBy, we'll primarily use attendanceRecords
        setAttendanceRecords([]);
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to load attendance history (${response.status})`
        );
      }

      // Parse the response data
      const data = (await response.json()) as AttendanceHistoryResponse;

      // Always set the regular records
      if (Array.isArray(data.records)) {
        setAttendanceRecords(data.records);
      } else {
        setAttendanceRecords([]);
      }

      // Set grouped records if available and groupBy is active
      if (groupBy) {
        if (data.groupedRecords && Array.isArray(data.groupedRecords)) {
          // Process the grouped records to ensure they have all required properties
          const processedGroups = data.groupedRecords.map(group => ({
            ...group,
            // Ensure checkInCount exists, fallback to records.length
            checkInCount: group.checkInCount || group.records.length,
          }));
          setGroupedRecords(processedGroups);
        } else {
          setGroupedRecords([]);
        }
      } else {
        // When not grouping, we don't need grouped records
        setGroupedRecords([]);
      }

      // Set pagination info
      if (data.pagination && typeof data.pagination.totalPages === 'number') {
        setTotalPages(data.pagination.totalPages);
      } else {
        setTotalPages(1);
      }

      setError(null);
    } catch (err: any) {
      console.error('Error fetching attendance history:', err);
      const errorMessage = err.message || 'Failed to load attendance history';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
    // Reset to page 1 when searching
    setPage(1);
    fetchAttendanceHistory();
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  // We're now using the imported calculateDuration function from date-utils.ts

  // Safe date formatting function - using our formatDate function with custom format
  const safeFormat = (
    date: string | Date | null,
    formatString: string,
    fallback: string = 'N/A'
  ) => {
    return formatDate(date, formatString, fallback);
  };

  const viewLocationDetails = (record: AttendanceWithRelations) => {
    setSelectedRecord(record);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Date filter and search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by date..."
              className="pl-8"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" size="icon" className="h-10 w-10">
            <Filter className="h-4 w-4" />
          </Button>
        </form>

        {/* Group by selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm whitespace-nowrap">Group by:</span>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1 sm:flex-none"
            value={groupBy || ''}
            onChange={e => setGroupBy(e.target.value || null)}
          >
            <option value="">None</option>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
      </div>

      {/* Main content card */}
      <Card>
        <CardContent className="p-3 sm:p-6">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-muted-foreground">{error}</div>
          ) : attendanceRecords.length === 0 && (!groupedRecords || groupedRecords.length === 0) ? (
            <div className="p-4 text-center text-muted-foreground">No attendance records found</div>
          ) : groupBy ? (
            /* Grouped view */
            <>
              {/* Mobile card view for grouped records */}
              <div className="block sm:hidden space-y-4">
                {groupedRecords?.map(group => (
                  <div key={group.period} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 p-3 border-b">
                      <h3 className="font-medium">
                        {groupBy === 'day' ? (
                          safeFormat(group.period, 'EEEE, MMMM d, yyyy', group.period)
                        ) : groupBy === 'week' ? (
                          <span title={group.period}>{group.period}</span>
                        ) : groupBy === 'month' ? (
                          safeFormat(`${group.period}-01`, 'MMMM yyyy', group.period)
                        ) : (
                          group.period
                        )}
                      </h3>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-muted/30 p-2 rounded">
                          <div className="text-xs text-muted-foreground">Check-ins</div>
                          <div className="font-medium">
                            {group.checkInCount || group.records.length}
                          </div>
                        </div>
                        <div className="bg-muted/30 p-2 rounded">
                          <div className="text-xs text-muted-foreground">Total Hours</div>
                          <div className="font-medium">{group.totalHours.toFixed(1)}h</div>
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full mt-2 text-xs">
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>
                              {groupBy === 'day'
                                ? safeFormat(group.period, 'EEEE, MMMM d, yyyy', group.period)
                                : groupBy === 'week'
                                  ? `Week: ${group.period}`
                                  : groupBy === 'month'
                                    ? safeFormat(group.period + '-01', 'MMMM yyyy', group.period)
                                    : group.period}
                            </DialogTitle>
                            <DialogDescription>
                              {group.checkInCount || group.records.length} check-ins,{' '}
                              {group.totalHours.toFixed(2)} total hours
                            </DialogDescription>
                          </DialogHeader>
                          <div className="max-h-[60vh] overflow-auto">
                            {/* Mobile view of records in dialog */}
                            <div className="block sm:hidden space-y-3">
                              {group.records.map((record: AttendanceWithRelations) => (
                                <div key={record.id} className="border rounded-lg p-3 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <div className="font-medium">
                                      {safeFormat(record.checkInTime, 'MMM d, yyyy')}
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {calculateDuration(record.checkInTime, record.checkOutTime)}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">Check In: </span>
                                      {safeFormat(record.checkInTime, 'h:mm a')}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Check Out: </span>
                                      {record.checkOutTime
                                        ? safeFormat(record.checkOutTime, 'h:mm a', 'Invalid time')
                                        : 'In progress'}
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs"
                                    onClick={() => viewLocationDetails(record)}
                                  >
                                    <MapPin className="h-3 w-3 mr-1" />
                                    View Location
                                  </Button>
                                </div>
                              ))}
                            </div>

                            {/* Desktop view of records in dialog */}
                            <div className="hidden sm:block overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="whitespace-nowrap">Date</TableHead>
                                    <TableHead className="whitespace-nowrap">Check In</TableHead>
                                    <TableHead className="whitespace-nowrap">Check Out</TableHead>
                                    <TableHead className="whitespace-nowrap">Duration</TableHead>
                                    <TableHead className="whitespace-nowrap">Location</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {group.records.map((record: AttendanceWithRelations) => (
                                    <TableRow key={record.id}>
                                      <TableCell className="whitespace-nowrap">
                                        {safeFormat(record.checkInTime, 'MMM d, yyyy')}
                                      </TableCell>
                                      <TableCell className="whitespace-nowrap">
                                        {safeFormat(record.checkInTime, 'h:mm a')}
                                      </TableCell>
                                      <TableCell className="whitespace-nowrap">
                                        {record.checkOutTime
                                          ? safeFormat(
                                              record.checkOutTime,
                                              'h:mm a',
                                              'Invalid time'
                                            )
                                          : 'In progress'}
                                      </TableCell>
                                      <TableCell className="whitespace-nowrap">
                                        {calculateDuration(record.checkInTime, record.checkOutTime)}
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={() => viewLocationDetails(record)}
                                        >
                                          <MapPin className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table view for grouped records */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Check-ins</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Avg. Hours/Day</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedRecords?.map(group => (
                      <TableRow key={group.period}>
                        <TableCell className="font-medium">
                          {groupBy === 'day' ? (
                            safeFormat(group.period, 'EEEE, MMMM d, yyyy', group.period)
                          ) : groupBy === 'week' ? (
                            <span title={group.period}>{group.period}</span>
                          ) : groupBy === 'month' ? (
                            safeFormat(`${group.period}-01`, 'MMMM yyyy', group.period)
                          ) : (
                            group.period
                          )}
                        </TableCell>
                        <TableCell>
                          {group.checkInCount || group.records.length} check-ins
                        </TableCell>
                        <TableCell>{group.totalHours.toFixed(2)} hours</TableCell>
                        <TableCell>{group.averageHoursPerDay.toFixed(2)} hours/day</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="View Details"
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[95vw] max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>
                                  {groupBy === 'day'
                                    ? safeFormat(group.period, 'EEEE, MMMM d, yyyy', group.period)
                                    : groupBy === 'week'
                                      ? `Week: ${group.period}`
                                      : groupBy === 'month'
                                        ? safeFormat(
                                            group.period + '-01',
                                            'MMMM yyyy',
                                            group.period
                                          )
                                        : group.period}
                                </DialogTitle>
                                <DialogDescription>
                                  {group.checkInCount || group.records.length} check-ins,{' '}
                                  {group.totalHours.toFixed(2)} total hours
                                </DialogDescription>
                              </DialogHeader>
                              <div className="max-h-[60vh] overflow-auto">
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="whitespace-nowrap">Date</TableHead>
                                        <TableHead className="whitespace-nowrap">
                                          Check In
                                        </TableHead>
                                        <TableHead className="whitespace-nowrap">
                                          Check Out
                                        </TableHead>
                                        <TableHead className="whitespace-nowrap">
                                          Duration
                                        </TableHead>
                                        <TableHead className="whitespace-nowrap">
                                          Location
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {group.records.map((record: AttendanceWithRelations) => (
                                        <TableRow key={record.id}>
                                          <TableCell className="whitespace-nowrap">
                                            {safeFormat(record.checkInTime, 'MMM d, yyyy')}
                                          </TableCell>
                                          <TableCell className="whitespace-nowrap">
                                            {safeFormat(record.checkInTime, 'h:mm a')}
                                          </TableCell>
                                          <TableCell className="whitespace-nowrap">
                                            {record.checkOutTime
                                              ? safeFormat(
                                                  record.checkOutTime,
                                                  'h:mm a',
                                                  'Invalid time'
                                                )
                                              : 'In progress'}
                                          </TableCell>
                                          <TableCell className="whitespace-nowrap">
                                            {calculateDuration(
                                              record.checkInTime,
                                              record.checkOutTime
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 w-8 p-0"
                                              onClick={() => viewLocationDetails(record)}
                                            >
                                              <MapPin className="h-4 w-4" />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            /* Ungrouped view */
            <>
              {/* Mobile card view for individual records */}
              <div className="block sm:hidden space-y-3">
                {attendanceRecords.map((record: AttendanceWithRelations) => (
                  <div key={record.id} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 p-3 border-b flex justify-between items-center">
                      <div className="font-medium">
                        {safeFormat(record.checkInTime, 'MMM d, yyyy')}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {calculateDuration(record.checkInTime, record.checkOutTime)}
                      </Badge>
                    </div>
                    <div className="p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Check In</div>
                          <div>{safeFormat(record.checkInTime, 'h:mm a')}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Check Out</div>
                          <div>
                            {record.checkOutTime
                              ? safeFormat(record.checkOutTime, 'h:mm a', 'Invalid time')
                              : 'In progress'}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => viewLocationDetails(record)}
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          View Location
                        </Button>

                        <CorrectionRequestDialog
                          attendanceId={record.id}
                          originalCheckInTime={record.checkInTime}
                          originalCheckOutTime={record.checkOutTime}
                          onSuccess={fetchAttendanceHistory}
                          trigger={
                            <Button variant="outline" size="sm" className="text-xs">
                              Request Correction
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table view for individual records */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map(record => (
                      <TableRow key={record.id}>
                        <TableCell>{safeFormat(record.checkInTime, 'MMM d, yyyy')}</TableCell>
                        <TableCell>{safeFormat(record.checkInTime, 'h:mm a')}</TableCell>
                        <TableCell>
                          {record.checkOutTime
                            ? safeFormat(record.checkOutTime, 'h:mm a', 'Invalid time')
                            : 'In progress'}
                        </TableCell>
                        <TableCell>
                          {calculateDuration(record.checkInTime, record.checkOutTime)}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => viewLocationDetails(record)}
                              >
                                <MapPin className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[95vw] max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Location Details</DialogTitle>
                                <DialogDescription>
                                  Attendance record for{' '}
                                  {safeFormat(record.checkInTime, 'MMMM d, yyyy')}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-3 max-h-[70vh] overflow-y-auto">
                                {/* Session Summary at the top for quick reference */}
                                <div className="bg-primary/5 p-3 rounded-md text-sm border">
                                  <p className="font-medium flex items-center gap-2">
                                    <Info className="h-4 w-4 shrink-0" />
                                    Session Summary
                                  </p>
                                  <div className="mt-2 space-y-1">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <span className="text-muted-foreground text-xs">
                                          Check In:
                                        </span>
                                        <div>{safeFormat(record.checkInTime, 'h:mm a')}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground text-xs">
                                          Check Out:
                                        </span>
                                        <div>
                                          {record.checkOutTime
                                            ? safeFormat(
                                                record.checkOutTime,
                                                'h:mm a',
                                                'Invalid time'
                                              )
                                            : 'In progress'}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-primary/10">
                                      <span className="text-muted-foreground text-xs">
                                        Duration:
                                      </span>
                                      <div className="font-medium">
                                        {calculateDuration(record.checkInTime, record.checkOutTime)}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Check-in Location */}
                                <div className="space-y-3">
                                  <h4 className="text-sm font-medium flex items-center gap-2">
                                    <MapPin className="h-4 w-4 shrink-0" />
                                    Check-in Location
                                  </h4>
                                  {record.checkInLatitude && record.checkInLongitude ? (
                                    <div className="space-y-3">
                                      <div className="bg-muted/50 p-3 rounded-md">
                                        <p className="text-sm font-medium break-words">
                                          {record.checkInLocationName ||
                                            'Location name not available'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {safeFormat(
                                            record.checkInTime,
                                            "MMM d, yyyy 'at' h:mm a"
                                          )}
                                        </p>
                                      </div>

                                      <LocationMap
                                        latitude={record.checkInLatitude}
                                        longitude={record.checkInLongitude}
                                        className="h-40 w-full rounded-md overflow-hidden"
                                      />
                                      <div className="flex justify-end">
                                        <a
                                          href={`https://www.openstreetmap.org/?mlat=${record.checkInLatitude}&mlon=${record.checkInLongitude}#map=16/${record.checkInLatitude}/${record.checkInLongitude}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs flex items-center gap-1 text-primary hover:underline"
                                        >
                                          View larger map <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      No location data available
                                    </p>
                                  )}
                                </div>

                                {/* Check-out Location (if available) */}
                                {record.checkOutTime && (
                                  <div className="space-y-3 border-t pt-3">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                      <MapPin className="h-4 w-4 shrink-0" />
                                      Check-out Location
                                    </h4>
                                    {record.checkOutLatitude && record.checkOutLongitude ? (
                                      <div className="space-y-3">
                                        <div className="bg-muted/50 p-3 rounded-md">
                                          <p className="text-sm font-medium break-words">
                                            {record.checkOutLocationName ||
                                              'Location name not available'}
                                          </p>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {safeFormat(
                                              record.checkOutTime,
                                              "MMM d, yyyy 'at' h:mm a"
                                            )}
                                          </p>
                                        </div>

                                        <LocationMap
                                          latitude={record.checkOutLatitude}
                                          longitude={record.checkOutLongitude}
                                          className="h-40 w-full rounded-md overflow-hidden"
                                        />
                                        <div className="flex justify-end">
                                          <a
                                            href={`https://www.openstreetmap.org/?mlat=${record.checkOutLatitude}&mlon=${record.checkOutLongitude}#map=16/${record.checkOutLatitude}/${record.checkOutLongitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs flex items-center gap-1 text-primary hover:underline"
                                          >
                                            View larger map <ExternalLink className="h-3 w-3" />
                                          </a>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">
                                        No location data available
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell>
                          <CorrectionRequestDialog
                            attendanceId={record.id}
                            originalCheckInTime={record.checkInTime}
                            originalCheckOutTime={record.checkOutTime}
                            onSuccess={fetchAttendanceHistory}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={page <= 1}
                    className="flex-1 sm:flex-initial"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {!isMobile && 'Previous'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={page >= totalPages}
                    className="flex-1 sm:flex-initial"
                  >
                    {!isMobile && 'Next'}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
