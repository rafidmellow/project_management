'use client';

import { CheckCircle2, Circle, Plus, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Subtask } from '@/types/task';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Helper function to get user initials
function getUserInitials(name: string | null): string {
  if (!name) return 'U';

  const nameParts = name.split(' ');
  if (nameParts.length >= 2) {
    return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
  }

  return nameParts[0].substring(0, 2).toUpperCase();
}

interface SubtaskItemProps {
  subtask: Subtask;
  onToggleStatus: (id: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
  onAddNested: (id: string) => void;
  onToggleExpand?: (id: string) => void;
  isExpanded?: boolean;
  hasNestedSubtasks?: boolean;
}

export function SubtaskItem({
  subtask,
  onToggleStatus,
  onDelete,
  onAddNested,
  onToggleExpand,
  isExpanded = false,
  hasNestedSubtasks = false,
}: SubtaskItemProps) {
  return (
    <div className="flex items-center justify-between p-2 rounded-md border bg-card border-border">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Expand/collapse button for subtasks with children */}
        {hasNestedSubtasks && onToggleExpand ? (
          <button
            onClick={() => onToggleExpand(subtask.id)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-4" /> // Spacer for alignment
        )}

        <button
          onClick={() => onToggleStatus(subtask.id, subtask.completed)}
          className="shrink-0 text-primary hover:text-primary/80 transition-colors"
        >
          {subtask.completed ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>

        <span
          className={cn(
            'text-sm truncate',
            subtask.completed ? 'text-muted-foreground line-through' : 'text-foreground'
          )}
        >
          {subtask.title}
        </span>

        {subtask.priority && (
          <Badge
            variant={
              subtask.priority === 'high'
                ? 'destructive'
                : subtask.priority === 'low'
                  ? 'secondary'
                  : 'default'
            }
            className="text-[10px] px-1 py-0 h-4"
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

      <div className="flex items-center gap-2">
        {/* Assignees */}
        <AssigneeAvatars assignees={subtask.assignees} />

        {/* Action buttons */}
        <SubtaskActions subtaskId={subtask.id} onAddNested={onAddNested} onDelete={onDelete} />
      </div>
    </div>
  );
}

// Component for assignee avatars
function AssigneeAvatars({ assignees }: { assignees?: { id: string; user: any }[] }) {
  if (!assignees || assignees.length === 0) return null;

  return (
    <div className="flex -space-x-2">
      {assignees.slice(0, 2).map(assignee => (
        <TooltipProvider key={assignee.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-6 w-6 border border-black">
                {assignee.user.image ? (
                  <AvatarImage src={assignee.user.image} alt={assignee.user.name || 'User'} />
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
      {assignees.length > 2 && (
        <Avatar className="h-6 w-6 border border-black">
          <AvatarFallback className="text-xs bg-muted">+{assignees.length - 2}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

// Component for action buttons
function SubtaskActions({
  subtaskId,
  onAddNested,
  onDelete,
}: {
  subtaskId: string;
  onAddNested: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
        title="Add nested subtask"
        onClick={() => onAddNested(subtaskId)}
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(subtaskId)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  );
}
