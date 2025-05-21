'use client';

import { useState, useEffect } from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';
import { useUsers } from '@/hooks/use-users';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useHasPermission } from '@/hooks/use-has-permission';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserGrid } from '@/components/team/user-grid';
import { UserList } from '@/components/team/user-list';
import { Pagination } from '@/components/team/pagination';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const itemsPerPage = 12;

  // Use the enhanced useUsers hook with server-side pagination and filtering
  const { users, pagination, isLoading, isError, mutate } = useUsers({
    search: searchQuery,
    role: roleFilter,
    page: currentPage,
    limit: itemsPerPage,
  });

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { toast } = useToast();
  const router = useRouter();
  const { status } = useSession();

  // Use the permission hook instead of manual fetch
  const { hasPermission: canDeleteUsers } = useHasPermission('user_delete');

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // Redirect to the team members page
    if (status === 'authenticated') {
      router.push('/team/members');
    }
  }, [status, router]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const confirmDelete = (userId: string) => {
    // Check if user has permission to delete users
    if (!canDeleteUsers) {
      toast({
        title: 'Permission Denied',
        description: "You don't have permission to delete users.",
        variant: 'destructive',
      });
      return;
    }

    setUserToDelete(userId);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/users/${userToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      toast({
        title: 'User deleted',
        description: 'The user has been successfully deleted.',
      });

      // Close dialog and reset state
      setShowDeleteDialog(false);
      setUserToDelete(null);

      // Refresh the users list
      mutate();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  // Show loading state when checking auth or loading data
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Team</h1>
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Team</h1>
        <div className="rounded-md bg-destructive/15 p-4">
          <p className="text-destructive">Error loading users. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Get user counts by role (using the available users data)
  const userCounts = {
    total: users.length,
    admin: users.filter(u => u.role.toLowerCase() === 'admin').length,
    manager: users.filter(u => u.role.toLowerCase() === 'manager').length,
    user: users.filter(u => u.role.toLowerCase() === 'user').length,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-background sticky top-0 z-10 py-2">
        <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mt-2">
        <Card className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-0 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription>Total Members</CardDescription>
            <CardTitle className="text-3xl">{userCounts.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Active team members in your organization
            </p>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50 border-0 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription>Admins</CardDescription>
            <CardTitle className="text-3xl">{userCounts.admin}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Users with administrative privileges</p>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-0 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription>Managers</CardDescription>
            <CardTitle className="text-3xl">{userCounts.manager}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Project and team managers</p>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50 border-0 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription>Regular Users</CardDescription>
            <CardTitle className="text-3xl">{userCounts.user}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Regular team members with standard access
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xs border-0">
        <CardHeader className="pb-3 px-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Directory</CardTitle>
              <CardDescription>View and manage team members in your organization.</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {pagination && (
                <span>
                  Showing {users.length} of {pagination.total}{' '}
                  {pagination.total === 1 ? 'member' : 'members'}
                  {roleFilter !== 'all' &&
                    ` with role: ${roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}`}
                  {searchQuery && ` matching: "${searchQuery}"`}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-muted/30 p-4 rounded-lg">
            <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-8 bg-background"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>

            <Tabs
              defaultValue={viewMode}
              onValueChange={value => setViewMode(value as 'grid' | 'list')}
              className="w-full md:w-auto"
            >
              <TabsList className="grid w-full grid-cols-2 md:w-[160px] bg-background/80">
                <TabsTrigger value="grid" className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Grid
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="mt-6">
            {users.length === 0 && (
              <div className="rounded-md bg-muted p-4 mb-4 text-center">
                <p className="text-muted-foreground">No team members found</p>
              </div>
            )}

            {viewMode === 'grid' ? (
              <UserGrid users={users} onDelete={confirmDelete} />
            ) : (
              <UserList users={users} onDelete={confirmDelete} />
            )}

            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm User Deletion</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The user will be permanently removed from the system
              along with their data, tasks, and team memberships.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
