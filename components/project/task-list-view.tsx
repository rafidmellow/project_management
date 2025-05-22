'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { QuickTaskDialogNew as QuickTaskDialog } from '@/components/project/quick-task-dialog';
import { MoreHorizontal, ArrowUpDown, Clock, Calendar, Plus, UserPlus } from 'lucide-react';
import { AssignMembersPopup } from '@/components/project/assign-members-popup';
import { ProjectStatus } from '@/types/project';
import { Task, TaskAssignee } from '@/types/task';

interface TaskListViewProps {
  projectId: string;
  statuses: ProjectStatus[];
  tasks: Task[];
  isLoading: boolean;
  onEditTask?: (taskId: string) => void;
  onRefresh: () => Promise<void>;
}

// Component to manage assignees in the list view
interface ManageAssigneesProps {
  taskId: string;
  assignees: TaskAssignee[];
  onRefresh: () => Promise<void>;
}

function ManageAssignees({ taskId, assignees, onRefresh }: ManageAssigneesProps) {
  const [isAssignPopupOpen, setIsAssignPopupOpen] = useState(false);
  const { toast } = useToast();

  const handleAssign = async (userIds: string[]) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeIds: userIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to update assignees');
      }

      // Refresh the task list
      await onRefresh();

      toast({
        title: 'Assignees updated',
        description: 'Task assignees have been updated successfully',
      });
    } catch (error) {
      console.error('Error updating assignees:', error);
      toast({
        title: 'Error',
        description: 'Failed to update assignees',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="ml-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full"
        onClick={() => setIsAssignPopupOpen(true)}
      >
        <UserPlus className="h-3.5 w-3.5" />
      </Button>
      <AssignMembersPopup
        open={isAssignPopupOpen}
        onOpenChange={setIsAssignPopupOpen}
        selectedUserIds={assignees.map(a => a.user.id)}
        onAssign={handleAssign}
      />
    </div>
  );
}

export function TaskListView({
  projectId,
  statuses,
  tasks,
  isLoading,
  onEditTask,
  onRefresh,
}: TaskListViewProps) {
  const [sortField, setSortField] = useState<string>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks);
  const { toast } = useToast();

  // Update filtered tasks when tasks prop changes
  useEffect(() => {
    setFilteredTasks(tasks);
  }, [tasks]);

  // Sort tasks based on current sort field and direction
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let valueA, valueB;

    switch (sortField) {
      case 'title':
        valueA = a.title.toLowerCase();
        valueB = b.title.toLowerCase();
        break;
      case 'status':
        valueA = a.status?.name.toLowerCase() || '';
        valueB = b.status?.name.toLowerCase() || '';
        break;
      case 'priority':
        const priorityOrder = { low: 1, medium: 2, high: 3 };
        valueA = priorityOrder[a.priority.toLowerCase() as keyof typeof priorityOrder] || 0;
        valueB = priorityOrder[b.priority.toLowerCase() as keyof typeof priorityOrder] || 0;
        break;
      case 'dueDate':
        valueA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        valueB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        break;
      default:
        valueA = a.title.toLowerCase();
        valueB = b.title.toLowerCase();
    }

    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Handle sort column click
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

  // Format date for display
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle task completion toggle
  const toggleTaskCompletion = async (taskId: string) => {
    try {
      // Update on the server using the new dedicated endpoint
      const response = await fetch(`/api/tasks/${taskId}/toggle-completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update task');
      }

      // Get the updated task to determine its new status
      const data = await response.json();
      const isCompleted = data.task?.status?.isCompletedStatus || false;

      // Refresh data
      await onRefresh();

      toast({
        title: `Task marked as ${isCompleted ? 'completed' : 'incomplete'}`,
        description: 'Task status updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update task',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('title')}
                  className="flex items-center gap-1 font-medium"
                >
                  Title
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 font-medium"
                >
                  Status
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('priority')}
                  className="flex items-center gap-1 font-medium"
                >
                  Priority
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('dueDate')}
                  className="flex items-center gap-1 font-medium"
                >
                  Due Date
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Assignees</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No tasks found.
                </TableCell>
              </TableRow>
            ) : (
              sortedTasks.map(task => (
                <TableRow key={task.id} className={task.completed ? 'opacity-60 bg-muted/20' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTaskCompletion(task.id)}
                    />
                  </TableCell>
                  <TableCell className={task.completed ? 'line-through text-muted-foreground' : ''}>
                    {task.title}
                  </TableCell>
                  <TableCell>
                    {task.status && (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: task.status.color || '#888888' }}
                        />
                        <span>{task.status.name}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(
                          typeof task.dueDate === 'string'
                            ? task.dueDate
                            : task.dueDate.toISOString()
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {task.assignees && task.assignees.length > 0 ? (
                        <div className="flex -space-x-2 overflow-hidden">
                          {task.assignees.slice(0, 3).map(assignee => (
                            <Avatar key={assignee.id} className="h-6 w-6 border border-black">
                              {assignee.user.image ? (
                                <AvatarImage
                                  src={assignee.user.image}
                                  alt={assignee.user.name || 'User'}
                                />
                              ) : (
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {assignee.user.name
                                    ? assignee.user.name
                                        .split(' ')
                                        .map(n => n[0])
                                        .join('')
                                        .toUpperCase()
                                        .substring(0, 2)
                                    : assignee.user.email.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                          ))}
                          {task.assignees.length > 3 && (
                            <div className="flex items-center justify-center h-6 w-6 rounded-full border border-black bg-muted text-xs font-medium">
                              +{task.assignees.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground mr-2">Unassigned</span>
                      )}

                      {/* Add manage assignees button */}
                      <ManageAssignees
                        taskId={task.id}
                        assignees={task.assignees || []}
                        onRefresh={onRefresh}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditTask && onEditTask(task.id)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleTaskCompletion(task.id)}>
                          Mark as {task.status?.isCompletedStatus ? 'Incomplete' : 'Complete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
