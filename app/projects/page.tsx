'use client';

import Link from 'next/link';
import {
  Plus,
  Search,
  Edit,
  Trash,
  MoreHorizontal,
  Eye,
  ArrowUpDown,
  X,
  Calendar,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { NewProjectDialog } from '@/components/project/new-project-dialog';

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
import { useProjects } from '@/hooks/use-data';
import { projectApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Pagination } from '@/components/tasks/pagination';
import { Project } from '@/types/project';

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  // Date filter removed
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  // Team member filter removed
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);

  // Apply filters
  const activeFilters = {
    ...(searchTerm ? { title: searchTerm } : {}),
    // Date filter removed
    // Team member filter removed
    ...(sortField ? { sortField } : {}),
    ...(sortDirection ? { sortDirection } : {}),
    ...filters,
  };

  const { projects, isLoading, isError, mutate, pagination } = useProjects(page, 10, activeFilters);
  const { toast } = useToast();

  // Team member filter removed

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Team member filter toggle removed

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Scroll to top when changing pages
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Show error toast when there's an API error
  useEffect(() => {
    if (isError) {
      console.error('Projects page error:', isError);
      toast({
        title: 'Error loading projects',
        description: isError instanceof Error ? isError.message : 'Failed to load projects',
        variant: 'destructive',
      });
    }
  }, [isError, toast]);

  // Handle search input with debounce
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Log the search term for debugging
    console.log('Search term updated:', value);

    // Debounce the search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      console.log('Executing search for:', value);
      mutate();
    }, 500);

    // Clean up the timeout on next render
    return () => clearTimeout(timeoutId);
  };

  // Date filter functions removed

  // Reset filters
  const resetFilters = () => {
    // Reset all filter states
    setFilters({});
    setSearchTerm('');
    // Date filter reset removed
    // Team member filter reset removed
    setSortField('updatedAt');
    setSortDirection('desc');

    // Log the reset action for debugging
    console.log('Filters reset, forcing refresh');

    // Force an immediate refresh with reset filters
    console.log('Refreshing projects with reset filters');
    mutate();
  };

  const deleteProject = async (id: string) => {
    try {
      await projectApi.deleteProject(id);
      mutate(); // Refresh the data
      toast({
        title: 'Project deleted',
        description: 'The project has been deleted successfully',
      });
    } catch (err) {
      console.error('Error deleting project:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete the project',
        variant: 'destructive',
      });
    }
  };

  // Function to get user initials for avatar fallback
  const getUserInitials = (name?: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
      </div>

      {/* Search and Filter Controls - Responsive Layout */}
      <div className="mt-4">
        {/* Mobile View: Stacked Layout */}
        <div className="flex flex-col gap-2 sm:hidden">
          {/* Search Bar - Full Width on Mobile */}
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-8 h-9"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <div className="flex gap-2">
            {/* Team Members Filter removed */}

            {/* Date Filter Button removed */}

            {/* New Project Button - Mobile */}
            <Button
              size="sm"
              className="h-9 flex-1"
              onClick={() => setIsNewProjectDialogOpen(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              <span className="truncate">New Project</span>
            </Button>

            {/* Clear Filters Button - Mobile */}
            {Object.keys(activeFilters).length > 2 && (
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={resetFilters}>
                <X className="h-4 w-4" />
                <span className="sr-only">Clear Filters</span>
              </Button>
            )}
          </div>
        </div>

        {/* Desktop View: Row Layout */}
        <div className="hidden sm:flex sm:flex-row gap-2 items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Search Bar - Reduced Width on Desktop */}
            <div className="relative w-[280px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-8 h-9"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            {/* Team Members Filter removed */}

            {/* Date Filter Button removed */}

            {/* Clear Filters Button - Desktop */}
            {Object.keys(activeFilters).length > 2 && (
              <Button variant="ghost" size="sm" className="h-9" onClick={resetFilters}>
                <X className="mr-2 h-4 w-4" />
                <span className="truncate">Clear Filters</span>
              </Button>
            )}
          </div>

          {/* New Project Button - Desktop */}
          <Button size="sm" className="h-9" onClick={() => setIsNewProjectDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* Date Filter Panel removed */}

      {isLoading ? (
        <div className="text-center p-3 sm:p-4 mt-3 sm:mt-4">
          <div className="animate-spin w-5 h-5 sm:w-6 sm:h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Loading projects...</p>
        </div>
      ) : isError ? (
        <div className="text-center p-3 sm:p-4 mt-3 sm:mt-4 text-red-500 border border-red-200 rounded-md bg-red-50/50 shadow-xs">
          <p className="font-semibold text-sm sm:text-base">Error loading projects</p>
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
      ) : projects && projects.length > 0 ? (
        <div className="mt-4">
          {/* Desktop Table View - Hidden on Small Screens */}
          <div className="hidden sm:block rounded-md border shadow-xs overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('title')}
                      className={cn(
                        'flex items-center gap-1 font-medium -ml-3 px-3',
                        sortField === 'title' && 'text-primary'
                      )}
                    >
                      Name
                      <ArrowUpDown
                        className={cn('h-4 w-4', sortField === 'title' && 'text-primary')}
                      />
                      {sortField === 'title' && (
                        <span className="sr-only">
                          {sortDirection === 'asc' ? 'sorted ascending' : 'sorted descending'}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('startDate')}
                      className={cn(
                        'flex items-center gap-1 font-medium -ml-3 px-3',
                        sortField === 'startDate' && 'text-primary'
                      )}
                    >
                      Start Date
                      <ArrowUpDown
                        className={cn('h-4 w-4', sortField === 'startDate' && 'text-primary')}
                      />
                      {sortField === 'startDate' && (
                        <span className="sr-only">
                          {sortDirection === 'asc' ? 'sorted ascending' : 'sorted descending'}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('endDate')}
                      className={cn(
                        'flex items-center gap-1 font-medium -ml-3 px-3',
                        sortField === 'endDate' && 'text-primary'
                      )}
                    >
                      End Date
                      <ArrowUpDown
                        className={cn('h-4 w-4', sortField === 'endDate' && 'text-primary')}
                      />
                      {sortField === 'endDate' && (
                        <span className="sr-only">
                          {sortDirection === 'asc' ? 'sorted ascending' : 'sorted descending'}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project: Project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.title}</TableCell>
                    <TableCell>
                      {project.createdBy ? (
                        <span>{project.createdBy.name || project.createdBy.email}</span>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.startDate
                        ? new Date(project.startDate).toLocaleDateString()
                        : 'Not set'}
                    </TableCell>
                    <TableCell>
                      {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                    </TableCell>
                    <TableCell>
                      <div className="flex -space-x-2 overflow-hidden">
                        {project.teamMembers && project.teamMembers.length > 0 ? (
                          <>
                            {project.teamMembers.slice(0, 3).map(member => (
                              <Avatar key={member.id} className="h-8 w-8 border border-black">
                                {member.user?.image ? (
                                  <AvatarImage
                                    src={member.user.image}
                                    alt={member.user?.name || ''}
                                  />
                                ) : (
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {getUserInitials(member.user?.name)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                            ))}
                            {project.teamMembers.length > 3 && (
                              <div className="flex items-center justify-center h-8 w-8 rounded-full border border-black bg-muted text-xs font-medium">
                                +{project.teamMembers.length - 3}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground text-sm">No members</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/projects/${project.id}`}
                              className="cursor-pointer flex items-center"
                            >
                              <Eye className="mr-2 h-4 w-4" /> View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/projects/${project.id}`}
                              className="cursor-pointer flex items-center"
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteProject(project.id)}
                            className="text-destructive focus:text-destructive cursor-pointer flex items-center"
                          >
                            <Trash className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View - Enhanced for Small Screens */}
          <div className="sm:hidden space-y-3">
            {projects.map((project: Project) => (
              <div key={project.id} className="border rounded-md p-3 shadow-xs bg-card">
                <div className="flex justify-between items-start mb-1.5">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-base font-medium hover:underline line-clamp-2"
                  >
                    {project.title}
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 -mt-1 -mr-1">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[150px]">
                      <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="text-xs">
                        <Link
                          href={`/projects/${project.id}`}
                          className="cursor-pointer flex items-center"
                        >
                          <Eye className="mr-2 h-3.5 w-3.5" /> View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-xs">
                        <Link
                          href={`/projects/${project.id}`}
                          className="cursor-pointer flex items-center"
                        >
                          <Edit className="mr-2 h-3.5 w-3.5" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteProject(project.id)}
                        className="text-destructive focus:text-destructive cursor-pointer flex items-center text-xs"
                      >
                        <Trash className="mr-2 h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="text-xs text-muted-foreground mb-2 space-y-0.5">
                  {project.createdBy && (
                    <div className="flex items-center gap-1">
                      <span>Created by: {project.createdBy.name || project.createdBy.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {project.startDate
                        ? new Date(project.startDate).toLocaleDateString()
                        : 'No start date'}
                      {project.endDate
                        ? ` - ${new Date(project.endDate).toLocaleDateString()}`
                        : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {project.teamMembers && project.teamMembers.length > 0 ? (
                      <>
                        {project.teamMembers.slice(0, 3).map(member => (
                          <Avatar key={member.id} className="h-6 w-6 border border-black">
                            {member.user?.image ? (
                              <AvatarImage src={member.user.image} alt={member.user?.name || ''} />
                            ) : (
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                {getUserInitials(member.user?.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        ))}
                        {project.teamMembers.length > 3 && (
                          <div className="flex items-center justify-center h-6 w-6 rounded-full border border-black bg-muted text-[10px] font-medium">
                            +{project.teamMembers.length - 3}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground text-xs">No members</span>
                    )}
                  </div>

                  <Button variant="outline" size="sm" className="h-6 text-xs px-2" asChild>
                    <Link href={`/projects/${project.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-3 sm:mt-4 px-0 sm:px-4">
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-4 sm:p-6 mt-3 sm:mt-4 border rounded-md bg-muted/10 shadow-xs">
          <p className="text-muted-foreground text-sm sm:text-base">No projects found</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 sm:mt-4 text-xs sm:text-sm h-8 sm:h-9"
            onClick={() => setIsNewProjectDialogOpen(true)}
          >
            Create your first project
          </Button>
        </div>
      )}

      {/* New Project Dialog */}
      <NewProjectDialog
        open={isNewProjectDialogOpen}
        onOpenChange={setIsNewProjectDialogOpen}
        onSuccess={() => mutate()} // Refresh the project list after creating a new project
      />
    </>
  );
}
