'use client';

import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './task-card';
import { Task } from '@/types/task';
import { cn } from '@/lib/utils';

interface SortableTaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string) => Promise<void>;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onUpdateAssignees: (taskId: string, assigneeIds: string[]) => Promise<void>;
}

/**
 * A sortable wrapper for TaskCard that enables drag and drop functionality
 * Uses @dnd-kit/sortable to make the task draggable and handle drag state
 * Wrapped in memo for better performance
 */
export const SortableTaskItem = memo(function SortableTaskItemComponent({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onUpdateAssignees,
}: SortableTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  // Apply transform and transition styles for drag animation
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Extract drag handle props for the TaskCard - only pass listeners and attributes
  // to the drag handle, not the entire card
  const dragHandleProps = {
    ...listeners,
    ...attributes,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('touch-manipulation', isDragging ? 'opacity-50 z-10' : '')}
      data-task-id={task.id}
    >
      <TaskCard
        task={task}
        isDragging={isDragging}
        dragHandleProps={dragHandleProps}
        showDragHandle={true}
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
        onDelete={onDelete}
        onUpdateAssignees={onUpdateAssignees}
      />
    </div>
  );
});
