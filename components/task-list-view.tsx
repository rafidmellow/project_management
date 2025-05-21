'use client';

import type { Column, Task } from '@/types';
import { ChevronRight, Plus, Check, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTask } from './tasks/sortable-task';
import {
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  reorderTasks,
  moveTaskBetweenColumns,
} from '@/lib/dnd-utils';
import { useToast } from '@/hooks/use-toast';

interface Props {
  columns: Column[];
  onAddTask: (columnId: string, task: Partial<Task>) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onReorderTasks: (columnId: string, tasks: Task[]) => Promise<void>;
  onMoveTask: (taskId: string, sourceColumnId: string, targetColumnId: string) => Promise<void>;
}

interface NewTask {
  columnId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export default function TaskListView({
  columns,
  onAddTask,
  onUpdateTask,
  onReorderTasks,
  onMoveTask,
}: Props) {
  const [newTask, setNewTask] = useState<NewTask | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localColumns, setLocalColumns] = useState(columns);
  const { toast } = useToast();

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

  const startNewTask = (columnId: string) => {
    setNewTask({
      columnId,
      title: '',
      description: '',
      priority: 'medium',
    });
  };

  const handleNewTaskSubmit = () => {
    if (!newTask || !newTask.title.trim()) return;

    onAddTask(newTask.columnId, {
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
    });

    setNewTask(null);
  };

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
      toast({
        title: 'Error',
        description: 'Failed to update task position',
        variant: 'destructive',
      });
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

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xs">
        {localColumns.map(column => (
          <div key={column.id} className="border-b last:border-b-0">
            <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-700">{column.title}</h2>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => startNewTask(column.id)}
              >
                <Plus size={16} />
                Add Task
              </Button>
            </div>
            <div className="divide-y">
              {newTask?.columnId === column.id && (
                <div className="px-6 py-4 bg-blue-50">
                  <div className="flex items-start gap-4">
                    <ChevronRight size={16} className="text-gray-400 shrink-0 mt-2" />
                    <div className="flex-1 space-y-3">
                      <Input
                        type="text"
                        value={newTask.title}
                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="Task title"
                        className="w-full"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleNewTaskSubmit();
                          }
                          if (e.key === 'Escape') {
                            setNewTask(null);
                          }
                        }}
                      />
                      <Textarea
                        value={newTask.description}
                        onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                        placeholder="Task description"
                        className="w-full"
                        rows={2}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            e.preventDefault();
                            handleNewTaskSubmit();
                          }
                          if (e.key === 'Escape') {
                            setNewTask(null);
                          }
                        }}
                      />
                      <div className="flex items-center justify-between">
                        <Select
                          value={newTask.priority}
                          onValueChange={value =>
                            setNewTask({ ...newTask, priority: value as 'low' | 'medium' | 'high' })
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low Priority</SelectItem>
                            <SelectItem value="medium">Medium Priority</SelectItem>
                            <SelectItem value="high">High Priority</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button onClick={handleNewTaskSubmit} className="flex items-center gap-1">
                            <Check size={16} />
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setNewTask(null)}
                            className="flex items-center gap-1"
                          >
                            <X size={16} />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <SortableContext
                items={column.tasks.map(task => task.id)}
                strategy={verticalListSortingStrategy}
              >
                {column.tasks.map(task => (
                  <SortableTask key={task.id} task={task} columnId={column.id} view="list" />
                ))}
              </SortableContext>
              {column.tasks.length === 0 && !newTask && (
                <div className="px-6 py-8 text-center text-gray-500">
                  <p>No tasks in this column</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <SortableTask task={activeTask} columnId={activeTask.status} view="list" />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
