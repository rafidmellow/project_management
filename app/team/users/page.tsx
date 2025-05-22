'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Grid, List, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserList } from '@/components/team/user-list';
import { useHasPermission } from '@/hooks/use-has-permission';
import { useUsers } from '@/hooks/use-users';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Check permissions
  const { hasPermission: canAddUsers } = useHasPermission('user_create');
  const { hasPermission: canManageUsers } = useHasPermission('user_management');

  // Use the enhanced useUsers hook with server-side pagination and filtering
  const { users, pagination, isLoading, isError, mutate } = useUsers({
    search: searchQuery,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    page: currentPage,
    limit: itemsPerPage,
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-background sticky top-0 z-10 py-2">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <div className="flex items-center gap-2">
          {canAddUsers && (
            <Link href="/team/users/new">
              <Button className="bg-black hover:bg-black/90 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add New User
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card className="shadow-xs border-0">
        <CardHeader className="pb-3">
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage users in your organization. Users can be assigned to projects as team members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  type="search"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="guest">Guest</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-9 rounded-r-none"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-9 rounded-l-none"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <UserList
              users={users}
              viewMode={viewMode}
              isLoading={isLoading}
              pagination={
                pagination
                  ? {
                      total: pagination.total,
                      totalCount: pagination.total,
                      page: pagination.page,
                      limit: pagination.limit,
                      pageSize: pagination.limit,
                      totalPages: pagination.totalPages,
                      pageCount: pagination.totalPages,
                    }
                  : undefined
              }
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onUserDeleted={() => mutate()}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
