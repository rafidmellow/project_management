'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TaskDragData } from '@/types/kanban';
import type { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
  columnId: string;
  isDragging?: boolean;
  onUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

export function TaskCard({ task, columnId, isDragging, onUpdate }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
    data: {
      task,
      columnId,
    } as TaskDragData,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleToggleComplete = async () => {
    if (onUpdate) {
      await onUpdate(task.id, { completed: !task.completed });
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-lg' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.assignees?.map(assignee => (
              <Avatar key={assignee.id} className="h-6 w-6">
                <AvatarImage src={assignee.avatar} alt={assignee.name} />
                <AvatarFallback>{assignee.name[0]}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          {task.priority && (
            <Badge variant={task.priority === 'high' ? 'destructive' : 'default'}>
              {task.priority}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
