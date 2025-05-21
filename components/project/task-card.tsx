'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { safeFormat } from '@/lib/utils/date';
import { Calendar, MoreHorizontal, Pencil, Trash, Check, Plus, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Task, TaskAssignee } from '@/types/task';
import { AssignMembersPopup } from './assign-members-popup';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  dragHandleProps?: any;
  showDragHandle?: boolean;
  onToggleComplete: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onUpdateAssignees: (taskId: string, assigneeIds: string[]) => void;
}

export function TaskCard({
  task,
  isDragging = false,
  dragHandleProps = {},
  showDragHandle = true,
  onToggleComplete,
  onEdit,
  onDelete,
  onUpdateAssignees,
}: TaskCardProps) {
  // Force re-render when task changes
  const [, forceUpdate] = useState({});

  // Update the component when the task changes
  useEffect(() => {
    forceUpdate({});
  }, [task.dueDate, task.startDate, task.endDate]);

  const formatDate = (dateString?: string | Date | null) => {
    return safeFormat(dateString, 'MMM d, yyyy', 'Not set');
  };

  // Calculate days remaining or overdue
  const getDueDateStatus = (dueDate?: string | Date | null) => {
    if (!dueDate) return null;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Use the date object if it's already a Date, otherwise create a new one
      const due = dueDate instanceof Date ? new Date(dueDate) : new Date(dueDate);
      due.setHours(0, 0, 0, 0);

      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return `${Math.abs(diffDays)} days overdue`;
      } else if (diffDays === 0) {
        return 'Due today';
      } else if (diffDays === 1) {
        return 'Due tomorrow';
      } else {
        return `${diffDays} days remaining`;
      }
    } catch (error) {
      console.error('Error calculating due date status:', error);
      return 'Invalid date';
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Determine if task is completed based on completed field
  const isCompleted = task.completed;

  return (
    <div
      className={cn(
        'bg-background p-2 xs:p-3 rounded-md shadow-xs border-l-4 flex flex-col gap-1.5 xs:gap-2',
        'transition-all duration-200 hover:shadow-md touch-manipulation',
        isCompleted ? 'opacity-70' : '',
        isDragging ? 'shadow-lg ring-2 ring-primary ring-opacity-50' : ''
      )}
      style={{
        borderLeftColor: task.status?.color || '#6E56CF',
      }}
    >
      {/* Header with title and actions */}
      <div className="flex justify-between items-start gap-1 xs:gap-2">
        {showDragHandle && (
          <div
            className="drag-handle flex items-center cursor-grab active:cursor-grabbing touch-none mt-0.5 xs:mt-1 mr-0.5"
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          </div>
        )}

        <div className="flex items-start gap-1 xs:gap-2 min-w-0 flex-1">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => {
              onToggleComplete(task.id);
            }}
            className="mt-0.5 xs:mt-1 shrink-0 h-4 w-4"
            aria-label={`Mark task "${task.title}" as ${isCompleted ? 'incomplete' : 'complete'}`}
          />
          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                'font-medium text-xs xs:text-sm leading-tight break-words',
                isCompleted ? 'line-through text-muted-foreground' : ''
              )}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-0.5 xs:mt-1 line-clamp-2 break-words">
                {task.description}
              </p>
            )}
          </div>
        </div>

        <TaskCardMenu
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleComplete={onToggleComplete}
        />
      </div>

      {/* Task metadata */}
      <div className="flex flex-wrap gap-1 xs:gap-1.5 mt-0.5 xs:mt-1">
        {task.priority && (
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] xs:text-xs py-0 h-4 xs:h-5',
              getPriorityColor(task.priority)
            )}
          >
            {task.priority}
          </Badge>
        )}

        {task.dueDate && (
          <Badge
            variant="outline"
            className="flex items-center gap-0.5 xs:gap-1 text-[10px] xs:text-xs py-0 h-4 xs:h-5"
          >
            <Calendar className="h-2.5 w-2.5 xs:h-3 xs:w-3" />
            <span className="whitespace-nowrap">{getDueDateStatus(task.dueDate)}</span>
          </Badge>
        )}
      </div>

      {/* Footer with assignees */}
      <div className="flex justify-end mt-auto pt-1 xs:pt-2">
        <AssigneeAvatars
          assignees={task.assignees || []}
          maxDisplay={3}
          onUpdateAssignees={assigneeIds => onUpdateAssignees(task.id, assigneeIds)}
        />
      </div>
    </div>
  );
}

// Task card dropdown menu
function TaskCardMenu({
  task,
  onEdit,
  onDelete,
  onToggleComplete,
}: {
  task: Task;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
}) {
  // Determine if task is completed based on completed field
  const isCompleted = task.completed;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(task.id)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onToggleComplete(task.id)}>
          <Check className="mr-2 h-4 w-4" />
          Mark as {isCompleted ? 'Incomplete' : 'Complete'}
        </DropdownMenuItem>
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Consistent assignee avatars component
interface AssigneeAvatarsProps {
  assignees: TaskAssignee[];
  maxDisplay?: number;
  onUpdateAssignees: (assigneeIds: string[]) => void;
}

export function AssigneeAvatars({
  assignees,
  maxDisplay = 3,
  onUpdateAssignees,
}: AssigneeAvatarsProps) {
  const [isAssignPopupOpen, setIsAssignPopupOpen] = useState(false);

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
    <div className="flex items-center">
      <div className="flex -space-x-2 overflow-hidden">
        {assignees.slice(0, maxDisplay).map(assignee => (
          <Avatar key={assignee.id} className="h-6 w-6 xs:h-7 xs:w-7 border border-black">
            {assignee.user.image ? (
              <AvatarImage src={assignee.user.image} alt={assignee.user.name || 'Team member'} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] xs:text-xs">
                {getUserInitials(assignee.user.name)}
              </AvatarFallback>
            )}
          </Avatar>
        ))}

        {assignees.length > maxDisplay && (
          <div className="flex items-center justify-center h-6 w-6 xs:h-7 xs:w-7 rounded-full border border-black bg-muted text-[10px] xs:text-xs font-medium">
            +{assignees.length - maxDisplay}
          </div>
        )}
      </div>

      {/* Use the AssignMembersPopup component with a click handler */}
      <AssignMembersPopup
        open={isAssignPopupOpen}
        onOpenChange={setIsAssignPopupOpen}
        selectedUserIds={assignees.map(a => a.user.id)}
        onAssign={onUpdateAssignees}
      />

      {/* Add a button to open the popup */}
      <div
        className="h-6 w-6 xs:h-7 xs:w-7 rounded-full border border-black border-dashed bg-background cursor-pointer hover:bg-muted transition-colors hover:border-primary flex items-center justify-center ml-1"
        onClick={() => setIsAssignPopupOpen(true)}
      >
        <Plus className="h-3 w-3 xs:h-4 xs:w-4 text-black" />
      </div>
    </div>
  );
}
