'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/use-toast';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { CorrectionRequestReviewDialog } from '@/components/attendance/correction-request-review-dialog';

export default function AttendanceAdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('records');

  // Records state
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsTotalPages, setRecordsTotalPages] = useState(1);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsSearchQuery, setRecordsSearchQuery] = useState('');
  const [recordsSummary, setRecordsSummary] = useState<any>(null);

  // Correction requests state
  const [correctionRequests, setCorrectionRequests] = useState<any[]>([]);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsTotalPages, setRequestsTotalPages] = useState(1);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Check if user has attendance management permission
  useEffect(() => {
    if (!session) return;

    // Check if user has the required permission
    const checkPermission = async () => {
      try {
        const response = await fetch(
          `/api/users/check-permission?permission=attendance_management`
        );
        const data = await response.json();

        if (!data.hasPermission) {
          toast({
            title: 'Access Denied',
            description: "You don't have permission to access the admin dashboard",
            variant: 'destructive',
          });
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking permission:', error);
        // If there's an error checking permission, redirect to be safe
        router.push('/dashboard');
      }
    };

    checkPermission();
  }, [session, router, toast]);

  // Fetch attendance records
  useEffect(() => {
    if (activeTab !== 'records') return;

    const fetchAttendanceRecords = async () => {
      try {
        setRecordsLoading(true);
        const response = await fetch(`/api/attendance/admin/records?page=${recordsPage}&limit=10`);

        if (!response.ok) {
          throw new Error('Failed to fetch attendance records');
        }

        const data = await response.json();
        setAttendanceRecords(data.attendanceRecords);
        setRecordsTotalPages(data.pagination.totalPages);
        setRecordsSummary(data.summary);
      } catch (error) {
        console.error('Error fetching attendance records:', error);
        toast({
          title: 'Error',
          description: 'Failed to load attendance records',
          variant: 'destructive',
        });
      } finally {
        setRecordsLoading(false);
      }
    };

    fetchAttendanceRecords();
  }, [activeTab, recordsPage, toast]);

  // Fetch correction requests
  useEffect(() => {
    if (activeTab !== 'requests') return;

    const fetchCorrectionRequests = async () => {
      try {
        setRequestsLoading(true);
        const response = await fetch(
          `/api/attendance/admin/correction-requests?page=${requestsPage}&limit=10&status=${statusFilter}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch correction requests');
        }

        const data = await response.json();
        setCorrectionRequests(data.correctionRequests);
        setRequestsTotalPages(data.pagination.totalPages);
      } catch (error) {
        console.error('Error fetching correction requests:', error);
        toast({
          title: 'Error',
          description: 'Failed to load correction requests',
          variant: 'destructive',
        });
      } finally {
        setRequestsLoading(false);
      }
    };

    fetchCorrectionRequests();
  }, [activeTab, requestsPage, statusFilter, toast]);

  // Handle correction request review completion
  const handleReviewComplete = () => {
    // Refresh the correction requests list
    if (activeTab === 'requests') {
      setRequestsLoading(true);
      fetch(
        `/api/attendance/admin/correction-requests?page=${requestsPage}&limit=10&status=${statusFilter}`
      )
        .then(response => {
          if (!response.ok) throw new Error('Failed to refresh correction requests');
          return response.json();
        })
        .then(data => {
          setCorrectionRequests(data.correctionRequests);
          setRequestsTotalPages(data.pagination.totalPages);
        })
        .catch(error => {
          console.error('Error refreshing correction requests:', error);
        })
        .finally(() => {
          setRequestsLoading(false);
        });
    }
  };

  // Filter attendance records by search query
  const filteredRecords = attendanceRecords.filter(record => {
    if (!recordsSearchQuery) return true;

    const searchLower = recordsSearchQuery.toLowerCase();
    const nameMatch = record.user.name?.toLowerCase().includes(searchLower) || false;
    const emailMatch = record.user.email.toLowerCase().includes(searchLower) || false;
    const locationMatch = record.checkInLocationName?.toLowerCase().includes(searchLower) || false;

    return nameMatch || emailMatch || locationMatch;
  });

  if (!session) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Admin</h1>
          <p className="text-muted-foreground">Manage attendance records and correction requests</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="records">Attendance Records</TabsTrigger>
          <TabsTrigger value="requests">Correction Requests</TabsTrigger>
        </TabsList>

        {/* Attendance Records Tab */}
        <TabsContent value="records">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Attendance Records
              </CardTitle>
              <CardDescription>View and manage attendance records for all users</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by name, email, or location..."
                    className="pl-8"
                    value={recordsSearchQuery}
                    onChange={e => setRecordsSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Summary Cards */}
              {recordsSummary && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                      <Users className="h-5 w-5 mb-2 text-primary" />
                      <div className="text-2xl font-bold">{recordsSummary.uniqueUsers}</div>
                      <div className="text-sm text-muted-foreground">Unique Users</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                      <Calendar className="h-5 w-5 mb-2 text-primary" />
                      <div className="text-2xl font-bold">{recordsSummary.totalRecords}</div>
                      <div className="text-sm text-muted-foreground">Total Records</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                      <Clock className="h-5 w-5 mb-2 text-primary" />
                      <div className="text-2xl font-bold">
                        {recordsSummary.totalHours.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Hours</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Records Table */}
              {recordsLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No attendance records found
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map(record => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={record.user.image || undefined} />
                                <AvatarFallback>
                                  {(record.user.name || record.user.email).substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{record.user.name || 'N/A'}</div>
                                <div className="text-xs text-muted-foreground">
                                  {record.user.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(record.checkInTime), 'MMM d, yyyy h:mm a')}
                          </TableCell>
                          <TableCell>
                            {record.checkOutTime
                              ? format(new Date(record.checkOutTime), 'MMM d, yyyy h:mm a')
                              : 'In progress'}
                          </TableCell>
                          <TableCell>
                            {record.totalHours ? `${record.totalHours.toFixed(1)}h` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate">
                              {record.checkInLocationName || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {record.correctionRequests && record.correctionRequests.length > 0 ? (
                              <Badge
                                variant="outline"
                                className="bg-amber-100 text-amber-800 hover:bg-amber-100"
                              >
                                Correction Pending
                              </Badge>
                            ) : record.checkOutTime ? (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800 hover:bg-green-100"
                              >
                                Completed
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-blue-100 text-blue-800 hover:bg-blue-100"
                              >
                                In Progress
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {recordsTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {recordsPage} of {recordsTotalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRecordsPage(p => Math.max(p - 1, 1))}
                      disabled={recordsPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRecordsPage(p => Math.min(p + 1, recordsTotalPages))}
                      disabled={recordsPage === recordsTotalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Correction Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                Correction Requests
              </CardTitle>
              <CardDescription>Review and manage attendance correction requests</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="all">All Statuses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Requests Table */}
              {requestsLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : correctionRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No correction requests found
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Original Time</TableHead>
                        <TableHead>Requested Time</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {correctionRequests.map(request => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={request.user.image || undefined} />
                                <AvatarFallback>
                                  {(request.user.name || request.user.email).substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{request.user.name || 'N/A'}</div>
                                <div className="text-xs text-muted-foreground">
                                  {request.user.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              In: {format(new Date(request.originalCheckInTime), 'MMM d, h:mm a')}
                            </div>
                            {request.originalCheckOutTime && (
                              <div>
                                Out:{' '}
                                {format(new Date(request.originalCheckOutTime), 'MMM d, h:mm a')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              In: {format(new Date(request.requestedCheckInTime), 'MMM d, h:mm a')}
                            </div>
                            {request.requestedCheckOutTime && (
                              <div>
                                Out:{' '}
                                {format(new Date(request.requestedCheckOutTime), 'MMM d, h:mm a')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate" title={request.reason}>
                              {request.reason}
                            </div>
                          </TableCell>
                          <TableCell>
                            {request.status === 'pending' ? (
                              <Badge
                                variant="outline"
                                className="bg-amber-100 text-amber-800 hover:bg-amber-100"
                              >
                                Pending
                              </Badge>
                            ) : request.status === 'approved' ? (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800 hover:bg-green-100"
                              >
                                Approved
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-red-100 text-red-800 hover:bg-red-100"
                              >
                                Rejected
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {request.status === 'pending' ? (
                              <CorrectionRequestReviewDialog
                                request={request}
                                onComplete={handleReviewComplete}
                              />
                            ) : (
                              <Button variant="outline" size="sm" className="gap-1" disabled>
                                <Info className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Processed</span>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {requestsTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {requestsPage} of {requestsTotalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRequestsPage(p => Math.max(p - 1, 1))}
                      disabled={requestsPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRequestsPage(p => Math.min(p + 1, requestsTotalPages))}
                      disabled={requestsPage === requestsTotalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
