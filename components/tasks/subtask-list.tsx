'use client';

import { useState, useCallback, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { taskApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Subtask } from '@/types/task';

interface SubtaskListProps {
  parentTaskId: string;
  projectId: string;
  subtasks: Subtask[];
  onSubtaskChange: () => void;
  depth?: number;
  maxInitialDepth?: number;
  showHeader?: boolean;
}

export function SubtaskList({
  parentTaskId,
  projectId,
  subtasks,
  onSubtaskChange,
  depth = 0,
  maxInitialDepth = 2,
  showHeader = true,
}: SubtaskListProps) {
  const { toast } = useToast();
  const [addingNestedToId, setAddingNestedToId] = useState<string | null>(null);
  const [nestedSubtaskTitle, setNestedSubtaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});
  const [loadingSubtasks, setLoadingSubtasks] = useState<Record<string, boolean>>({});

  // Initialize expanded subtasks on mount - expand subtasks with children up to maxInitialDepth
  useEffect(() => {
    if (depth < maxInitialDepth) {
      const initialExpanded: Record<string, boolean> = {};

      // Find subtasks with children and mark them as expanded
      subtasks.forEach(subtask => {
        if (subtask.subtasks && subtask.subtasks.length > 0) {
          initialExpanded[subtask.id] = true;
        }
      });

      // Update expanded state if we found any subtasks to expand
      if (Object.keys(initialExpanded).length > 0) {
        setExpandedSubtasks(prev => ({ ...prev, ...initialExpanded }));
      }
    }
  }, [subtasks, depth, maxInitialDepth]);

  // Get user initials for avatar fallback
  const getUserInitials = (name: string | null) => {
    if (!name) return 'U';

    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }

    return nameParts[0].substring(0, 2).toUpperCase();
  };

  // Function to load subtasks on demand
  const loadSubtasks = useCallback(
    async (subtaskId: string) => {
      // Skip if already loading or expanded
      if (loadingSubtasks[subtaskId] || expandedSubtasks[subtaskId]) {
        return;
      }

      try {
        setLoadingSubtasks(prev => ({ ...prev, [subtaskId]: true }));

        // Fetch subtasks from the API
        const response = await fetch(`/api/tasks/${subtaskId}?includeSubtasks=true`);

        if (!response.ok) {
          throw new Error('Failed to load subtasks');
        }

        // Parse the response
        const data = await response.json();

        // Update the subtasks in the parent component
        onSubtaskChange();

        // Mark as expanded
        setExpandedSubtasks(prev => ({ ...prev, [subtaskId]: true }));
      } catch (error) {
        console.error('Error loading subtasks:', error);
        toast({
          title: 'Error',
          description: 'Failed to load subtasks. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoadingSubtasks(prev => ({ ...prev, [subtaskId]: false }));
      }
    },
    [loadingSubtasks, expandedSubtasks, onSubtaskChange, toast]
  );

  // Function to toggle expansion of a subtask
  const toggleSubtaskExpansion = useCallback(
    (subtaskId: string) => {
      // If not expanded yet, load the subtasks
      if (!expandedSubtasks[subtaskId]) {
        loadSubtasks(subtaskId);
      } else {
        // Toggle expansion state
        setExpandedSubtasks(prev => ({
          ...prev,
          [subtaskId]: !prev[subtaskId],
        }));
      }
    },
    [expandedSubtasks, loadSubtasks]
  );

  const handleAddNestedSubtask = async (parentSubtaskId: string) => {
    const trimmedTitle = nestedSubtaskTitle.trim();
    if (!trimmedTitle) return;

    // Validate title length
    if (trimmedTitle.length < 3) {
      toast({
        title: 'Validation Error',
        description: 'Nested subtask title must be at least 3 characters long',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      await taskApi.createTask({
        title: trimmedTitle,
        projectId,
        parentId: parentSubtaskId,
        priority: 'medium',
      });

      setNestedSubtaskTitle('');
      setAddingNestedToId(null);
      onSubtaskChange();

      toast({
        title: 'Nested subtask added',
        description: 'Nested subtask has been added successfully',
      });
    } catch (error) {
      console.error('Error adding nested subtask:', error);
      toast({
        title: 'Error',
        description: 'Failed to add nested subtask. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (taskId: string, isCompleted: boolean) => {
    try {
      setIsLoading(true);

      // Call the API to update the task's completed status
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !isCompleted }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update task status');
      }

      toast({
        title: 'Subtask updated',
        description: `Subtask marked as ${!isCompleted ? 'completed' : 'pending'}`,
      });

      // Refresh the task list
      onSubtaskChange();
    } catch (error) {
      console.error('Error toggling subtask status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update subtask status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this subtask? This will also delete all nested subtasks.'
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      await taskApi.deleteTask(subtaskId);

      toast({
        title: 'Subtask deleted',
        description: 'Subtask has been deleted successfully',
      });

      // Refresh the task list
      onSubtaskChange();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete subtask',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Subtask list */}
      <ul className="divide-y divide-border">
        {subtasks.map(subtask => (
          <li key={subtask.id}>
            <div
              className={cn(
                'flex items-center justify-between p-3 group hover:bg-muted/30 transition-colors',
                subtask.completed && 'bg-muted/20'
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Expand/collapse button for subtasks with children */}
                <div className="flex items-center">
                  {subtask.subtasks && subtask.subtasks.length > 0 ? (
                    <button
                      onClick={() => toggleSubtaskExpansion(subtask.id)}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer mr-1"
                      aria-label={
                        expandedSubtasks[subtask.id] ? 'Collapse subtasks' : 'Expand subtasks'
                      }
                      type="button"
                    >
                      {expandedSubtasks[subtask.id] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    <div className="w-4 mr-1" /> // Spacer for alignment
                  )}

                  <button
                    onClick={() => handleToggleStatus(subtask.id, subtask.completed || false)}
                    className={cn(
                      'shrink-0 transition-colors rounded-full',
                      subtask.completed
                        ? 'text-primary hover:text-primary/80'
                        : 'text-muted-foreground hover:text-primary'
                    )}
                  >
                    {subtask.completed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      'text-sm font-medium',
                      subtask.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                    )}
                  >
                    {subtask.title}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5">
                    {subtask.priority && (
                      <Badge
                        variant={
                          subtask.priority === 'high'
                            ? 'destructive'
                            : subtask.priority === 'low'
                              ? 'secondary'
                              : 'default'
                        }
                        className="text-[10px] px-1.5 py-0 h-4"
                      >
                        {subtask.priority}
                      </Badge>
                    )}

                    {subtask.dueDate && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(subtask.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Assignees */}
                {subtask.assignees && subtask.assignees.length > 0 ? (
                  <div className="flex -space-x-2 mr-1">
                    {subtask.assignees.slice(0, 2).map(assignee => (
                      <TooltipProvider key={assignee.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Avatar className="h-6 w-6 border border-background">
                              {assignee.user.image ? (
                                <AvatarImage
                                  src={assignee.user.image}
                                  alt={assignee.user.name || 'User'}
                                />
                              ) : null}
                              <AvatarFallback className="text-xs">
                                {getUserInitials(assignee.user.name)}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            {assignee.user.name || assignee.user.email}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                    {subtask.assignees.length > 2 && (
                      <Avatar className="h-6 w-6 border border-background">
                        <AvatarFallback className="text-xs bg-muted">
                          +{subtask.assignees.length - 2}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ) : subtask.assignedTo ? (
                  <Avatar className="h-6 w-6 mr-1">
                    {subtask.assignedTo.image ? (
                      <AvatarImage
                        src={subtask.assignedTo.image}
                        alt={subtask.assignedTo.name || 'User'}
                      />
                    ) : null}
                    <AvatarFallback className="text-xs">
                      {getUserInitials(subtask.assignedTo.name)}
                    </AvatarFallback>
                  </Avatar>
                ) : null}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                  title="Add nested subtask"
                  onClick={() => setAddingNestedToId(subtask.id)}
                >
                  <Plus className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteSubtask(subtask.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Show form for adding nested subtask */}
            {addingNestedToId === subtask.id && (
              <div className="pl-8 border-l-2 border-primary/30 ml-3 mt-3 mb-2">
                <div className="flex items-center gap-2 bg-muted/20 p-3 rounded-md">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Enter nested subtask title..."
                      value={nestedSubtaskTitle}
                      onChange={e => setNestedSubtaskTitle(e.target.value)}
                      className="h-9 pl-9 text-sm border-dashed focus:border-solid"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNestedSubtask(subtask.id);
                        } else if (e.key === 'Escape') {
                          setAddingNestedToId(null);
                          setNestedSubtaskTitle('');
                        }
                      }}
                    />
                    <ChevronRight className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                  </div>
                  <Button
                    size="sm"
                    className="h-9 bg-black hover:bg-black/90 text-white"
                    onClick={() => handleAddNestedSubtask(subtask.id)}
                  >
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => {
                      setAddingNestedToId(null);
                      setNestedSubtaskTitle('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Loading state for nested subtasks */}
            {loadingSubtasks[subtask.id] && (
              <div className="pl-8 border-l-2 border-primary/30 ml-3 mt-3 mb-2">
                <div className="bg-muted/20 p-3 rounded-md">
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <Skeleton className="h-5 w-40" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Render nested subtasks if they exist and are expanded */}
            {subtask.subtasks && subtask.subtasks.length > 0 && (
              <>
                {expandedSubtasks[subtask.id] && (
                  <div className="pl-8 border-l-2 border-primary/30 ml-3 mt-3 mb-2">
                    <div className="bg-muted/10 rounded-md overflow-hidden">
                      <SubtaskList
                        parentTaskId={subtask.id}
                        projectId={projectId}
                        subtasks={subtask.subtasks}
                        onSubtaskChange={onSubtaskChange}
                        depth={depth + 1}
                        maxInitialDepth={maxInitialDepth}
                        showHeader={false}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </li>
        ))}

        {subtasks.length === 0 && (
          <li className="text-sm text-muted-foreground text-center py-3">No subtasks yet.</li>
        )}
      </ul>

      {/* Loading indicator for the entire list */}
      {isLoading && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-md shadow-md p-2 z-50 flex items-center gap-2">
          <Spinner className="h-4 w-4" />
          <span className="text-xs">Updating subtasks...</span>
        </div>
      )}
    </div>
  );
}
