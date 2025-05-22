'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { Edit, Trash, User as UserIcon, MoreHorizontal, ShieldCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/ui/role-badge';
import { useHasPermission } from '@/hooks/use-has-permission';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { UserSummary, Pagination as PaginationType } from '@/types/user';

interface UserListProps {
  users: UserSummary[];
  viewMode?: 'grid' | 'list';
  isLoading?: boolean;
  pagination?: PaginationType;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onUserDeleted?: () => void;
}

export function UserList({
  users,
  viewMode = 'list',
  isLoading = false,
  pagination,
  currentPage = 1,
  onPageChange,
  onUserDeleted,
}: UserListProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use permission-based checks instead of role-based checks
  const { hasPermission: canEditUsers } = useHasPermission('user_edit');
  const { hasPermission: canManageUsers } = useHasPermission('user_management');
  const { hasPermission: canManageRoles } = useHasPermission('manage_roles');
  const { hasPermission: canDeleteUsers } = useHasPermission('user_delete');

  // Get user initials for avatar fallback
  const getUserInitials = (name: string | null) => {
    if (!name) return 'U';

    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }

    return name.substring(0, 2).toUpperCase();
  };

  const confirmDelete = (user: UserSummary) => {
    if (!canDeleteUsers && !canManageUsers) {
      toast({
        title: 'Permission Denied',
        description: "You don't have permission to delete users.",
        variant: 'destructive',
      });
      return;
    }

    if (user.id === session?.user?.id) {
      toast({
        title: 'Action Denied',
        description: 'You cannot delete your own account.',
        variant: 'destructive',
      });
      return;
    }

    setUserToDelete(user);
    setConfirmDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);

    try {
      console.log(`Attempting to delete user: ${userToDelete.id}`);

      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Try to get the response body regardless of status
      let responseBody;
      try {
        responseBody = await response.json();
        console.log('Response body:', responseBody);
      } catch (e) {
        console.error('Could not parse response as JSON:', e);
      }

      if (!response.ok) {
        console.log(`Error response: ${response.status} - ${response.statusText}`);

        // Special handling for users with associated data
        if (response.status === 409) {
          let detailMessage = 'Cannot delete user with associated data:\n';

          if (responseBody?.associatedData) {
            const { teamMembers, projects, tasks, attendanceRecords } = responseBody.associatedData;

            if (teamMembers > 0) detailMessage += `- ${teamMembers} team memberships\n`;
            if (projects > 0) detailMessage += `- ${projects} projects\n`;
            if (tasks > 0) detailMessage += `- ${tasks} tasks\n`;
            if (attendanceRecords > 0)
              detailMessage += `- ${attendanceRecords} attendance records\n`;
          } else if (responseBody?.details) {
            detailMessage += responseBody.details;
          }

          detailMessage += '\n\nPlease remove these associations before deleting the user.';

          throw new Error(detailMessage);
        }

        // Handle other error types
        if (responseBody?.details) {
          throw new Error(
            `${responseBody.error || 'Failed to delete user'}: ${responseBody.details}`
          );
        }

        throw new Error(responseBody?.error || `Failed to delete user (${response.status})`);
      }

      // Close dialog and reset state
      setConfirmDeleteDialogOpen(false);
      setUserToDelete(null);

      toast({
        title: 'User deleted',
        description: 'The user has been deleted successfully.',
      });

      // Refresh the users list
      if (onUserDeleted) {
        onUserDeleted();
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);

      // Format the error message for better readability in the toast
      const errorMessage = error.message || 'Failed to delete user. Please try again.';

      // If the error message contains newlines, format it for the toast
      if (errorMessage.includes('\n')) {
        const lines = errorMessage.split('\n');
        toast({
          title: 'Error',
          description: (
            <div className="space-y-1">
              {lines.map((line: string, index: number) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          ),
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No users found matching your search criteria.
      </div>
    );
  }

  return (
    <div className="w-full">
      {viewMode === 'list' ? (
        <div className="rounded-md border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3 py-1">
                      <Avatar className="h-9 w-9 border border-black/10">
                        {user.image ? (
                          <AvatarImage src={user.image} alt={user.name || 'User'} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getUserInitials(user.name || null)}
                        </AvatarFallback>
                      </Avatar>
                      <Link
                        href={`/profile/${user.id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {user.name || 'Unnamed User'}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.active ? 'outline' : 'secondary'}>
                      {user.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/profile/${user.id}`} className="cursor-pointer">
                            <UserIcon className="mr-2 h-4 w-4" />
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        {(canEditUsers || canManageUsers) && (
                          <DropdownMenuItem asChild>
                            <Link href={`/team/users/edit/${user.id}`} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {canManageRoles && (
                          <DropdownMenuItem asChild>
                            <Link href={`/team/roles?userId=${user.id}`} className="cursor-pointer">
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Manage Role
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {(canDeleteUsers || canManageUsers) && user.id !== session?.user?.id && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => confirmDelete(user)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {users.map(user => (
            <Card key={user.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex flex-col items-center text-center mb-4">
                    <Avatar className="h-16 w-16 mb-2">
                      <AvatarImage src={user.image || ''} alt={user.name || ''} />
                      <AvatarFallback className="text-lg">
                        {getUserInitials(user.name || null)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-medium text-lg">{user.name || 'Unknown'}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="mt-2">
                      <RoleBadge role={user.role} />
                    </div>
                  </div>
                  <div className="flex justify-between mt-4">
                    <Link href={`/profile/${user.id}`}>
                      <Button variant="outline" size="sm">
                        <UserIcon className="mr-2 h-4 w-4" />
                        Profile
                      </Button>
                    </Link>
                    {(canDeleteUsers || canManageUsers) && user.id !== session?.user?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => confirmDelete(user)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pageCount > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    if (currentPage > 1 && onPageChange) onPageChange(currentPage - 1);
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {Array.from({ length: pagination.pageCount }).map((_, i) => {
                const page = i + 1;
                // Show first page, last page, and pages around current page
                if (
                  page === 1 ||
                  page === pagination.pageCount ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={e => {
                          e.preventDefault();
                          if (onPageChange) onPageChange(page);
                        }}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  (page === 2 && currentPage > 3) ||
                  (page === pagination.pageCount - 1 && currentPage < pagination.pageCount - 2)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    if (currentPage < pagination.pageCount && onPageChange)
                      onPageChange(currentPage + 1);
                  }}
                  className={
                    currentPage === pagination.pageCount ? 'pointer-events-none opacity-50' : ''
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm User Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.name || userToDelete?.email}? This
              action cannot be undone and will remove all data associated with this user.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setConfirmDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Trash className="mr-2 h-4 w-4" />
              )}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
