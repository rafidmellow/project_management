import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Column, Task } from '@/types';
import { TaskDragData, reorderTasks, moveTaskBetweenColumns } from '@/lib/dnd-utils';

interface UseDragDropProps {
  columns: Column[];
  onReorderTasks: (columnId: string, tasks: Task[]) => Promise<void>;
  onMoveTask: (taskId: string, sourceColumnId: string, targetColumnId: string) => Promise<void>;
  onError?: (error: Error) => void;
}

export function useDragDrop({ columns, onReorderTasks, onMoveTask, onError }: UseDragDropProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localColumns, setLocalColumns] = useState(columns);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    document.body.style.cursor = 'grabbing';
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    document.body.style.cursor = '';

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeData = active.data.current as TaskDragData;
    const overData = over.data.current as TaskDragData;

    if (!activeData || !overData) {
      setActiveId(null);
      return;
    }

    try {
      if (activeData.columnId !== overData.columnId) {
        // Moving between columns
        await onMoveTask(activeData.task.id, activeData.columnId, overData.columnId);

        const { sourceColumn, targetColumn } = moveTaskBetweenColumns(
          localColumns.find(c => c.id === activeData.columnId)!,
          localColumns.find(c => c.id === overData.columnId)!,
          activeData.task.id,
          overData.task.id
        );

        setLocalColumns(columns =>
          columns.map(col =>
            col.id === sourceColumn.id
              ? sourceColumn
              : col.id === targetColumn.id
                ? targetColumn
                : col
          )
        );
      } else if (active.id !== over.id) {
        // Reordering within the same column
        const column = localColumns.find(c => c.id === activeData.columnId);
        if (!column) return;

        const reorderedTasks = reorderTasks(column.tasks, active.id as string, over.id as string);
        await onReorderTasks(column.id, reorderedTasks);

        setLocalColumns(columns =>
          columns.map(col => (col.id === column.id ? { ...col, tasks: reorderedTasks } : col))
        );
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to update task position'));
    }

    setActiveId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as TaskDragData;
    const overData = over.data.current as TaskDragData;

    if (!activeData || !overData) return;

    if (activeData.columnId !== overData.columnId) {
      const { sourceColumn, targetColumn } = moveTaskBetweenColumns(
        localColumns.find(c => c.id === activeData.columnId)!,
        localColumns.find(c => c.id === overData.columnId)!,
        activeData.task.id,
        overData.task.id
      );

      setLocalColumns(columns =>
        columns.map(col =>
          col.id === sourceColumn.id
            ? sourceColumn
            : col.id === targetColumn.id
              ? targetColumn
              : col
        )
      );
    }
  };

  const activeTask = activeId
    ? localColumns.flatMap(col => col.tasks).find(task => task.id === activeId)
    : null;

  return {
    activeId,
    activeTask,
    localColumns,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
  };
}
