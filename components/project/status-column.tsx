'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { SortableTaskItem } from './sortable-task-item';
import { Task, ProjectStatus } from '@/types/task';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import React from 'react';

interface StatusColumnProps {
  status: ProjectStatus;
  tasks: Task[];
  onToggleComplete: (taskId: string) => Promise<void>;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onUpdateAssignees: (taskId: string, assigneeIds: string[]) => Promise<void>;
  onEditStatus?: (status: ProjectStatus) => void;
  onDeleteStatus?: (statusId: string) => void;
  onAddTask?: (statusId: string) => void;
  emptyStateMessage?: string;
}

/**
 * A column in the Kanban board that represents a status
 * Contains a list of tasks that can be dragged and dropped
 * Wrapped in React.memo to prevent unnecessary re-renders when other columns change
 */
export const StatusColumn = React.memo(function StatusColumnImpl({
  status,
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onUpdateAssignees,
  onEditStatus,
  onDeleteStatus,
  onAddTask,
  emptyStateMessage = 'No tasks',
}: StatusColumnProps) {
  // Make the column droppable
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: {
      type: 'status',
      status,
    },
  });

  // Log when a column is being dragged over
  if (isOver) {
    console.log(`Status column ${status.id} (${status.name}) is being dragged over`);
  }

  // Calculate classes for different states
  const columnClasses = cn(
    'shrink-0 w-[220px] xs:w-[260px] sm:w-[300px] md:w-[320px] h-full flex flex-col rounded-md',
    isOver ? 'ring-2 ring-primary ring-inset' : 'ring-1 ring-border',
    isOver && tasks.length === 0 ? 'bg-primary/5' : ''
  );

  const emptyStateClasses = cn(
    'p-4 rounded-md border-2 w-full transition-colors duration-200',
    isOver
      ? 'border-primary bg-primary/10 shadow-sm'
      : 'border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5'
  );

  return (
    <div ref={setNodeRef} className={columnClasses} style={{ minWidth: '220px' }}>
      <div className="p-2 bg-muted/50 rounded-t-md border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm truncate">{status.name}</h3>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>

            {/* Status actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Status actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onAddTask && (
                  <DropdownMenuItem onClick={() => onAddTask(status.id)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add task
                  </DropdownMenuItem>
                )}
                {onEditStatus && (
                  <DropdownMenuItem onClick={() => onEditStatus(status)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit status
                  </DropdownMenuItem>
                )}
                {onDeleteStatus && (
                  <DropdownMenuItem
                    onClick={() => onDeleteStatus(status.id)}
                    className="text-destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete status
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] bg-muted/20 rounded-b-md p-2 overflow-y-auto">
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-sm">
                <div className={emptyStateClasses}>
                  <p
                    className={cn(
                      'text-center',
                      isOver ? 'text-primary font-medium' : 'text-muted-foreground'
                    )}
                  >
                    {isOver ? 'Drop task here' : emptyStateMessage}
                  </p>
                </div>
              </div>
            ) : (
              tasks.map(task => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onUpdateAssignees={onUpdateAssignees}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
});
