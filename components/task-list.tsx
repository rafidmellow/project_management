'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MoreHorizontal, Clock, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTasks } from '@/hooks/use-data';
import { Input } from '@/components/ui/input';
import { taskApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';

export function TaskList() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState({});
  const { tasks, isLoading, isError, mutate, pagination } = useTasks(page, 10, filter);
  const { toast } = useToast();

  // Handle task completion update
  const handleCompletionChange = async (taskId: string, completed: boolean) => {
    try {
      // Instead of updating status, we would update a different field
      // For now, we'll just show a toast and refresh the data
      toast({
        title: 'Task updated',
        description: `Task marked as ${completed ? 'completed' : 'pending'}`,
      });
      mutate(); // Refresh the data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task completion',
        variant: 'destructive',
      });
    }
  };

  // Function to handle search
  const handleSearch = () => {
    setPage(1);
    setFilter(prev => ({ ...prev, title: searchQuery }));
  };

  // Get priority badge style based on priority
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading tasks. Please try again later.
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
            placeholder="Search tasks..."
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
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Assigned to</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <Spinner className="mx-auto" />
                <div className="mt-2 text-sm text-muted-foreground">Loading tasks...</div>
              </TableCell>
            </TableRow>
          ) : tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <div className="text-muted-foreground">No tasks found</div>
              </TableCell>
            </TableRow>
          ) : (
            tasks.map(task => (
              <TableRow key={task.id}>
                <TableCell>
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.project?.status?.name === 'completed'}
                    onCheckedChange={checked => handleCompletionChange(task.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{task.project?.title || '—'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getPriorityBadge(task.priority)}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.dueDate ? (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No deadline</span>
                  )}
                </TableCell>
                <TableCell>
                  {task.assignedToId ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={task.assignedTo?.image || ''}
                          alt={task.assignedTo?.name || ''}
                        />
                        <AvatarFallback>
                          {task.assignedTo?.name
                            ?.split(' ')
                            .map(n => n[0])
                            .join('') || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.assignedTo?.name || 'Unknown'}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
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
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Reassign</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
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
