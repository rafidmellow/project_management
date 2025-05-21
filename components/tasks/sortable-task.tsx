import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRight } from 'lucide-react';
import type { Task } from '@/types';
import { TaskDragData } from '@/lib/dnd-utils';

interface Props {
  task: Task;
  columnId: string;
  view: 'kanban' | 'list';
}

export function SortableTask({ task, columnId, view }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
      columnId,
    } as TaskDragData,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  if (view === 'list') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-4">
          <ChevronRight size={16} className="text-gray-400 shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{task.title}</h3>
            <p className="text-sm text-gray-600">{task.description}</p>
          </div>
          <span
            className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${priorityColors[task.priority || 'medium']}
            `}
          >
            {task.priority || 'medium'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 mb-2 cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <h3 className="font-medium text-gray-900 mb-2">{task.title}</h3>
      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
      <div className="flex items-center justify-between">
        <span
          className={`
            px-2 py-1 rounded-full text-xs font-medium
            ${priorityColors[task.priority || 'medium']}
          `}
        >
          {task.priority || 'medium'}
        </span>
        {task.dueDate && (
          <span className="text-xs text-gray-500">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
