'use client';

import { Plus, Search, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskList } from '@/components/tasks/task-list';
import { Pagination } from '@/components/tasks/pagination';
import { useTasks } from '@/hooks/use-data';
import { taskApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useUsers } from '@/hooks/use-users';
import type { Task } from '@/types/task';
import { TaskCreateModal } from '@/components/modals/task-create-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TasksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State with URL params as defaults
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [priorityFilter, setPriorityFilter] = useState<string>(
    searchParams.get('priority') || 'all'
  );
  const [teamMemberFilter, setTeamMemberFilter] = useState<string>(
    searchParams.get('assignee') || 'all'
  );
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    searchParams.get('order') === 'desc' ? 'desc' : 'asc'
  );
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMobileFilterMenuOpen, setIsMobileFilterMenuOpen] = useState(false);
  const [isDesktopFilterMenuOpen, setIsDesktopFilterMenuOpen] = useState(false);

  const itemsPerPage = 12;
  const { tasks: allTasks, isLoading, isError, mutate } = useTasks(1, 100); // Increased limit
  const { users } = useUsers({ limit: 100 }); // Fetch all users
  const { toast } = useToast();

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (priorityFilter !== 'all') params.set('priority', priorityFilter);
    if (teamMemberFilter !== 'all') params.set('assignee', teamMemberFilter);
    if (sortBy !== 'dueDate') params.set('sort', sortBy);
    if (sortDirection !== 'asc') params.set('order', sortDirection);
    if (currentPage !== 1) params.set('page', currentPage.toString());

    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : '/tasks', { scroll: false });
  }, [searchQuery, priorityFilter, teamMemberFilter, sortBy, sortDirection, currentPage, router]);

  // Filter tasks by priority, team member, and search query
  const filteredTasks = allTasks.filter((task: Task) => {
    const matchesPriority =
      priorityFilter === 'all' || task.priority.toLowerCase() === priorityFilter.toLowerCase();

    // Check if task is assigned to the selected team member
    const matchesTeamMember =
      teamMemberFilter === 'all' ||
      (task.assignees && task.assignees.some(assignee => assignee.user.id === teamMemberFilter));

    const matchesSearch =
      searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesPriority && matchesTeamMember && matchesSearch;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Determine sort direction multiplier (1 for ascending, -1 for descending)
    const directionMultiplier = sortDirection === 'asc' ? 1 : -1;

    if (sortBy === 'title') {
      return directionMultiplier * a.title.localeCompare(b.title);
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (
        directionMultiplier *
        (priorityOrder[b.priority.toLowerCase() as keyof typeof priorityOrder] -
          priorityOrder[a.priority.toLowerCase() as keyof typeof priorityOrder])
      );
    } else if (sortBy === 'dueDate') {
      if (!a.dueDate) return directionMultiplier * 1;
      if (!b.dueDate) return directionMultiplier * -1;
      return directionMultiplier * (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    } else if (sortBy === 'status') {
      if (!a.status?.name) return directionMultiplier * 1;
      if (!b.status?.name) return directionMultiplier * -1;
      return directionMultiplier * a.status.name.localeCompare(b.status.name);
    }
    return 0;
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTasks = sortedTasks.slice(startIndex, startIndex + itemsPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // No longer needed - removed status filter

  const deleteTask = async (id: string) => {
    try {
      await taskApi.deleteTask(id);
      mutate(); // Refresh the data
      toast({
        title: 'Task deleted',
        description: 'The task has been deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete the task',
        variant: 'destructive',
      });
    }
  };

  const toggleTaskCompletion = async (id: string) => {
    try {
      // Find the task to get its current completion state
      const task = allTasks.find((t: Task) => t.id === id);
      if (!task) return;

      // Optimistic update
      mutate((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t: Task) => (t.id === id ? { ...t, completed: !t.completed } : t)),
        };
      }, false);

      // Call the API to toggle completion
      const response = await fetch(`/api/tasks/${id}/toggle-completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to update task completion');
      }

      // Show success message
      toast({
        title: `Task marked as ${!task.completed ? 'completed' : 'incomplete'}`,
        description: 'Task status updated successfully',
      });

      // Refresh data
      mutate();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task completion status',
        variant: 'destructive',
      });
      // Refresh to revert optimistic update
      mutate();
    }
  };

  // Show loading state when loading data
  if (isLoading) {
    return (
      <>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        </div>
        <div className="text-center p-3 sm:p-4 mt-3 sm:mt-4">
          <div className="animate-spin w-5 h-5 sm:w-6 sm:h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        </div>
        <div className="text-center p-3 sm:p-4 mt-3 sm:mt-4 text-red-500 border border-red-200 rounded-md bg-red-50/50 shadow-xs">
          <p className="font-semibold text-sm sm:text-base">Error loading tasks</p>
          <p className="text-xs sm:text-sm mt-1 sm:mt-2">
            {isError instanceof Error ? isError.message : 'An unexpected error occurred'}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 sm:mt-4 h-8 text-xs sm:text-sm"
            onClick={() => mutate()}
          >
            Try Again
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
      </div>

      {/* Search and Filter Controls - Responsive Layout */}
      <div className="mt-4">
        {/* Mobile View: Stacked Layout */}
        <div className="flex flex-col gap-2 sm:hidden">
          {/* Search Bar - Full Width on Mobile */}
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-8 h-9"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <div className="flex gap-2">
            {/* Filter Button - Mobile */}
            <DropdownMenu open={isMobileFilterMenuOpen} onOpenChange={setIsMobileFilterMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 flex-1 gap-1">
                  <Filter className="h-4 w-4" /> Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Filter Tasks</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="p-2">
                  <p className="mb-2 text-xs font-medium">Priority</p>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DropdownMenuSeparator />

                <div className="p-2">
                  <p className="mb-2 text-xs font-medium">Assigned To</p>
                  <Select value={teamMemberFilter} onValueChange={setTeamMemberFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Team Members</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DropdownMenuSeparator />

                <div className="p-2">
                  <p className="mb-2 text-xs font-medium">Sort By</p>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dueDate">Due Date</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* New Task Button - Mobile */}
            <Button size="sm" className="h-9 flex-1" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              <span className="truncate">New Task</span>
            </Button>
          </div>
        </div>

        {/* Desktop View: Row Layout */}
        <div className="hidden sm:flex sm:flex-row gap-2 items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Search Bar - Reduced Width on Desktop */}
            <div className="relative w-[280px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>

            {/* Filter Button - Desktop */}
            <DropdownMenu open={isDesktopFilterMenuOpen} onOpenChange={setIsDesktopFilterMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  <Filter className="h-4 w-4" /> Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Filter Tasks</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="p-2">
                  <p className="mb-2 text-xs font-medium">Priority</p>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DropdownMenuSeparator />

                <div className="p-2">
                  <p className="mb-2 text-xs font-medium">Assigned To</p>
                  <Select value={teamMemberFilter} onValueChange={setTeamMemberFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Team Members</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DropdownMenuSeparator />

                <div className="p-2">
                  <p className="mb-2 text-xs font-medium">Sort By</p>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dueDate">Due Date</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* New Task Button - Desktop */}
          <Button size="sm" className="h-9" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* Task List */}
      <div className="mt-4">
        <TaskList
          tasks={paginatedTasks}
          onDelete={deleteTask}
          onToggleCompletion={toggleTaskCompletion}
          sortField={sortBy}
          sortDirection={sortDirection}
          onSort={field => {
            if (sortBy === field) {
              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy(field);
              setSortDirection('asc');
            }
          }}
        />

        {totalPages > 1 && (
          <div className="mt-3 sm:mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          mutate();
        }}
      />
    </>
  );
}
