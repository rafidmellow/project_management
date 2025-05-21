import { DndContext, DragOverlay } from '@dnd-kit/core';
import { TaskListColumn } from './TaskListColumn';
import { TaskListItem } from './TaskListItem';
import { useDragDrop } from '@/hooks/use-drag-drop';
import type { Column, Task } from '@/types';
import { api } from '@/lib/api';

interface TaskListViewProps {
  columns: Column[];
  onError?: (error: Error) => void;
}

export function TaskListView({ columns, onError }: TaskListViewProps) {
  const {
    activeId,
    activeTask,
    localColumns,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
  } = useDragDrop({
    columns,
    onReorderTasks: async (columnId, tasks) => {
      await api.reorderTasks(columnId, tasks);
    },
    onMoveTask: async (taskId, sourceColumnId, targetColumnId) => {
      await api.moveTask(taskId, sourceColumnId, targetColumnId);
    },
    onError,
  });

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex flex-col gap-4 h-full overflow-y-auto p-4">
        {localColumns.map(column => (
          <TaskListColumn key={column.id} column={column} />
        ))}
      </div>

      <DragOverlay>
        {activeId && activeTask ? <TaskListItem task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
