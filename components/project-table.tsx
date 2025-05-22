'use client';

import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/use-toast';
import { Clock, Search, Filter, MoreHorizontal, Edit, CheckCircle2, Trash } from 'lucide-react';
import { useProjects } from '@/hooks/use-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { projectApi } from '@/lib/api';
import { Project, ProjectWithRelations, ProjectStatus } from '@/types/project';

export function ProjectTable() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { projects, isLoading, isError, mutate, pagination } = useProjects(page, limit, filters);
  const { toast } = useToast();

  // Calculate project progress based on completed tasks vs total tasks
  const calculateProgress = (project: ProjectWithRelations) => {
    if (!project._count) return 0;
    const totalTasks = project._count.tasks || 0;
    if (totalTasks === 0) return 0;

    return Math.round(((project.completedTasks || 0) / totalTasks) * 100);
  };

  // Handle project deletion
  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await projectApi.deleteProject(projectId);
        toast({
          title: 'Project deleted',
          description: 'Project has been successfully deleted',
        });
        mutate(); // Refresh the data
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete project',
          variant: 'destructive',
        });
      }
    }
  };

  // Function to handle search
  const handleSearch = () => {
    setPage(1);
    setFilters(prev => ({ ...prev, title: searchQuery }));
  };

  // Get status badge style based on status name
  const getStatusBadge = (status: ProjectStatus | undefined | null) => {
    if (!status) return 'bg-gray-50 text-gray-700 border-gray-200';

    switch (status.name?.toLowerCase()) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'planning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'on hold':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading projects. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects..."
            className="pl-8"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button variant="outline" size="icon" title="Filter">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                <Spinner className="mx-auto" />
                <div className="mt-2 text-sm text-muted-foreground">Loading projects...</div>
              </TableCell>
            </TableRow>
          ) : projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                <div className="text-muted-foreground">No projects found</div>
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project: any) => {
              const progress = calculateProgress(project);

              return (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.title}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {/* Primary status */}
                      <Badge variant="outline" className={getStatusBadge(project.status)}>
                        {project.status?.name || 'Unknown'}
                      </Badge>

                      {/* Additional statuses */}
                      {project.statuses
                        ?.filter((link: any) => !link.isPrimary)
                        .map((link: any) => (
                          <Badge
                            key={link.id}
                            variant="outline"
                            style={{
                              backgroundColor: `${link.status.color}15`,
                              color: link.status.color,
                              borderColor: link.status.color,
                            }}
                          >
                            {link.status.name}
                          </Badge>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="w-[80px]" />
                      <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.endDate ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(project.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No deadline</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{project._count?.teamMembers || 0} members</span>
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
                          <a href={`/projects/${project.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark as Completed
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page => Math.max(1, page - 1))}
            disabled={page === 1 || isLoading}
          >
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page => Math.min(pagination.totalPages, page + 1))}
            disabled={page === pagination.totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
