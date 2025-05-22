'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  UniqueIdentifier,
  closestCorners,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskContext } from './task-context';
import { useToast } from '@/hooks/use-toast';
import { Task, ProjectStatus } from '@/types/task';
import { SortableTaskItem } from './sortable-task-item';
import { TaskCard } from './task-card';
import { sortableKeyboardCoordinates, getActivationConstraint } from '@/lib/dnd-utils';

interface StatusListViewProps {
  projectId: string;
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onEditStatus?: (status: ProjectStatus) => void;
  onDeleteStatus?: (statusId: string) => void;
  onAddTask?: (statusId: string) => void;
}

/**
 * Status section component with collapsible task list
 */
function StatusSection({
  status,
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onCreateTask,
  isOpen,
  onToggle,
  onEditStatus,
  onDeleteStatus,
  onAddTask,
  onUpdateAssignees,
  isOver,
}: {
  status: ProjectStatus;
  tasks: Task[];
  onToggleComplete: (taskId: string) => Promise<void>;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onCreateTask: () => void;
  isOpen: boolean;
  onToggle: () => void;
  onEditStatus?: (status: ProjectStatus) => void;
  onDeleteStatus?: (statusId: string) => void;
  onAddTask?: (statusId: string) => void;
  onUpdateAssignees: (taskId: string, assigneeIds: string[]) => Promise<void>;
  isOver: boolean;
}) {
  // Make the status section a droppable area
  const { setNodeRef } = useDroppable({
    id: `status-${status.id}`,
    data: {
      type: 'status',
      status,
    },
  });

  // Force the section to be open when dragging over it
  useEffect(() => {
    if (isOver && !isOpen) {
      onToggle();
    }
  }, [isOver, isOpen, onToggle]);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onToggle}
      className={cn('mb-4', isOver && 'ring-2 ring-primary ring-offset-2')}
    >
      <div
        className="flex items-center justify-between rounded-t-md p-3"
        style={{ backgroundColor: status.color + '20' }}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="p-1">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: status.color }}
          />
          <h3 className="font-medium truncate">{status.name}</h3>
          <div className="flex items-center justify-center h-5 min-w-6 px-1.5 text-xs font-medium rounded-full bg-muted">
            {tasks.length}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onEditStatus && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onEditStatus(status)}
            >
              <span className="sr-only">Edit status</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-pencil"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </Button>
          )}

          {onDeleteStatus && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => onDeleteStatus(status.id)}
            >
              <span className="sr-only">Delete status</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-trash-2"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" x2="10" y1="11" y2="17" />
                <line x1="14" x2="14" y1="11" y2="17" />
              </svg>
            </Button>
          )}

          {onAddTask && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onAddTask(status.id)}
            >
              <span className="sr-only">Add task</span>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <CollapsibleContent>
        <div
          ref={setNodeRef}
          className={cn(
            'rounded-b-md border border-t-0 p-2 min-h-[100px] transition-colors duration-200',
            isOver
              ? 'bg-primary/10 border-primary/30 border-2'
              : tasks.length === 0
                ? 'bg-muted/20 border-dashed border-2'
                : ''
          )}
          data-status-id={status.id}
          data-droppable="true"
        >
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-sm">
              <div
                className={cn(
                  'p-4 rounded-md border-2',
                  isOver
                    ? 'border-primary bg-primary/5'
                    : 'border-dashed border-muted-foreground/30'
                )}
              >
                <p className={isOver ? 'text-primary font-medium' : 'text-muted-foreground'}>
                  {isOver ? 'Drop task here' : 'No tasks in this status'}
                </p>
              </div>
            </div>
          ) : (
            <SortableContext
              items={tasks.map(task => task.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {tasks.map(task => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onUpdateAssignees={onUpdateAssignees}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * List view of tasks grouped by status
 * Uses @dnd-kit for drag and drop functionality
 */
export function StatusListViewDndKit({
  projectId,
  onEditTask,
  onDeleteTask,
  onEditStatus,
  onDeleteStatus,
  onAddTask,
}: StatusListViewProps) {
  const {
    tasks,
    statuses,
    isLoading,
    refreshTasks,
    toggleTaskCompletion,
    updateTaskAssignees,
    moveTask,
  } = useTaskContext();

  const { toast } = useToast();

  const [openStatuses, setOpenStatuses] = useState<Record<string, boolean>>({});
  const [expandAll, setExpandAll] = useState(true);
  const [activeTaskId, setActiveTaskId] = useState<UniqueIdentifier | null>(null);
  const [activeStatusId, setActiveStatusId] = useState<string | null>(null);
  const [clonedTasks, setClonedTasks] = useState<Task[]>([]);
  const [statusesWithDragOver, setStatusesWithDragOver] = useState<Record<string, boolean>>({});

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: getActivationConstraint(),
    }),
    useSensor(TouchSensor, {
      activationConstraint: getActivationConstraint(),
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize open states based on user preference or default
  useEffect(() => {
    // Try to load from localStorage
    try {
      const savedState = localStorage.getItem(`project-${projectId}-open-statuses`);
      if (savedState) {
        setOpenStatuses(JSON.parse(savedState));
        // Check if all are closed to set expandAll state
        const allStatuses = JSON.parse(savedState);
        const allClosed = Object.values(allStatuses).every(v => !v);
        setExpandAll(!allClosed);
      } else {
        // Default: open all statuses
        const initialState: Record<string, boolean> = {};
        statuses.forEach(status => {
          initialState[status.id] = true;
        });
        setOpenStatuses(initialState);
      }
    } catch (e) {
      console.error('Error loading saved status states:', e);
      // Fallback to all open
      const initialState: Record<string, boolean> = {};
      statuses.forEach(status => {
        initialState[status.id] = true;
      });
      setOpenStatuses(initialState);
    }
  }, [statuses, projectId]);

  // Save open states to localStorage when changed
  useEffect(() => {
    if (Object.keys(openStatuses).length > 0) {
      localStorage.setItem(`project-${projectId}-open-statuses`, JSON.stringify(openStatuses));
    }
  }, [openStatuses, projectId]);

  // Toggle a single status
  const toggleStatus = (statusId: string) => {
    setOpenStatuses(prev => {
      const newState = { ...prev, [statusId]: !prev[statusId] };
      // Check if all are now closed/open to update expandAll state
      const allClosed = Object.values(newState).every(v => !v);
      setExpandAll(!allClosed);
      return newState;
    });
  };

  // Toggle all statuses
  const toggleAllStatuses = () => {
    const newExpandAll = !expandAll;
    setExpandAll(newExpandAll);

    const newState: Record<string, boolean> = {};
    statuses.forEach(status => {
      newState[status.id] = newExpandAll;
    });
    setOpenStatuses(newState);
  };

  // Group tasks by status
  const getTasksByStatus = (statusId: string) => {
    // During drag operations, use the cloned tasks to show optimistic updates
    const tasksToUse = activeTaskId ? clonedTasks : tasks;
    return tasksToUse.filter(task => task.statusId === statusId).sort((a, b) => a.order - b.order);
  };

  // Find the active task being dragged
  const activeTask = activeTaskId ? tasks.find(task => task.id === activeTaskId.toString()) : null;

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    if (active.data.current?.type === 'task') {
      const task = active.data.current.task as Task;
      setActiveTaskId(active.id);
      setActiveStatusId(task.statusId || null);

      // Clone the tasks array for optimistic updates
      setClonedTasks([...tasks]);
    }
  };

  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || !active.data.current) return;

    const activeTask = active.data.current.task as Task;

    // Handle dragging over a status section
    if (over.data.current?.type === 'status' && activeTask) {
      const overId = over.id.toString().replace('status-', '');

      // Update the status that's being dragged over
      setStatusesWithDragOver(prev => ({
        ...prev,
        [overId]: true,
      }));

      // If dragging over a different status than the task is currently in
      if (activeTask.statusId !== overId) {
        setActiveStatusId(overId);

        // Update the cloned tasks for optimistic UI updates
        setClonedTasks(prev =>
          prev.map(task => (task.id === activeTask.id ? { ...task, statusId: overId } : task))
        );
      }
    }

    // Handle dragging over another task
    if (over.data.current?.type === 'task' && activeTask) {
      const overTask = over.data.current.task as Task;

      // If dragging over a task in a different status
      if (activeTask.statusId !== overTask.statusId) {
        setActiveStatusId(overTask.statusId || null);

        // Update the status that's being dragged over
        setStatusesWithDragOver(prev => ({
          ...prev,
          [overTask.statusId || '']: true,
        }));

        // Update the cloned tasks for optimistic UI updates
        setClonedTasks(prev => {
          // First, update the status of the active task
          const updatedTasks = prev.map(task =>
            task.id === activeTask.id ? { ...task, statusId: overTask.statusId } : task
          );

          // Then, reorder the tasks within the new status
          const tasksInStatus = updatedTasks.filter(
            t => t.statusId === overTask.statusId && t.id !== activeTask.id
          );

          const overTaskIndex = tasksInStatus.findIndex(t => t.id === overTask.id);

          // Insert the active task at the position of the over task
          const reorderedTasks = [...updatedTasks];
          const activeTaskIndex = reorderedTasks.findIndex(t => t.id === activeTask.id);

          if (activeTaskIndex !== -1) {
            reorderedTasks.splice(activeTaskIndex, 1);

            const targetIndex = reorderedTasks.findIndex(t => t.id === overTask.id);
            if (targetIndex !== -1) {
              reorderedTasks.splice(targetIndex, 0, { ...activeTask, statusId: overTask.statusId });
            }
          }

          return reorderedTasks;
        });
      }
      // If dragging over a task in the same status (reordering)
      else if (activeTask.id !== overTask.id) {
        // Update the cloned tasks for optimistic UI updates
        setClonedTasks(prev => {
          const activeTaskIndex = prev.findIndex(t => t.id === activeTask.id);
          const overTaskIndex = prev.findIndex(t => t.id === overTask.id);

          if (activeTaskIndex !== -1 && overTaskIndex !== -1) {
            // Create a new array with the task moved to the new position
            const result = [...prev];
            const [removed] = result.splice(activeTaskIndex, 1);
            result.splice(overTaskIndex, 0, removed);
            return result;
          }

          return prev;
        });
      }
    }
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // Clear all drag over states
    setStatusesWithDragOver({});

    if (!over) {
      setActiveTaskId(null);
      setActiveStatusId(null);
      setClonedTasks([]);
      return;
    }

    // Get the active task
    const activeTaskData = active.data.current?.task as Task;
    if (!activeTaskData) {
      setActiveTaskId(null);
      setActiveStatusId(null);
      setClonedTasks([]);
      return;
    }

    // Store original tasks for potential rollback
    const originalTasks = [...tasks];

    try {
      // If dropping onto a status section
      if (over.data.current?.type === 'status') {
        const newStatusId = over.id.toString().replace('status-', '');

        // If the status is changing
        if (activeTaskData.statusId !== newStatusId) {
          await moveTask(activeTaskData.id, newStatusId);
        }
      }
      // If dropping onto another task
      else if (over.data.current?.type === 'task') {
        const overTaskData = over.data.current.task as Task;

        // If dropping onto a task in a different status
        if (activeTaskData.statusId !== overTaskData.statusId) {
          await moveTask(activeTaskData.id, overTaskData.statusId || '', overTaskData.id);
        }
        // If dropping onto a task in the same status (reordering)
        else if (activeTaskData.id !== overTaskData.id) {
          await moveTask(activeTaskData.id, overTaskData.statusId || '', overTaskData.id);
        }
      }
    } catch (error) {
      // Detailed error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error('Error during drag and drop:', errorMessage);

      // Show error toast
      toast({
        title: 'Error moving task',
        description: `Failed to update task position: ${errorMessage}`,
        variant: 'destructive',
      });

      // Force a complete refresh of tasks to ensure consistency
      try {
        // Explicitly refresh tasks to recover from the error
        await refreshTasks();
      } catch (refreshError) {
        console.error('Error refreshing tasks after failed drag and drop:', refreshError);
      }
    } finally {
      setActiveTaskId(null);
      setActiveStatusId(null);
      setClonedTasks([]);
    }
  };

  // Handle drag cancel
  const handleDragCancel = () => {
    setActiveTaskId(null);
    setActiveStatusId(null);
    setClonedTasks([]);
    setStatusesWithDragOver({});
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="sm" onClick={toggleAllStatuses} className="text-xs">
          {expandAll ? 'Collapse All' : 'Expand All'}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        modifiers={[restrictToVerticalAxis]}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {statuses
          .sort((a, b) => a.order - b.order)
          .map(status => (
            <StatusSection
              key={status.id}
              status={status}
              tasks={getTasksByStatus(status.id)}
              onToggleComplete={toggleTaskCompletion}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onCreateTask={refreshTasks}
              isOpen={!!openStatuses[status.id]}
              onToggle={() => toggleStatus(status.id)}
              onEditStatus={onEditStatus}
              onDeleteStatus={onDeleteStatus}
              onAddTask={onAddTask}
              onUpdateAssignees={updateTaskAssignees}
              isOver={!!statusesWithDragOver[status.id]}
            />
          ))}

        {/* Drag overlay for the currently dragged task */}
        <DragOverlay adjustScale zIndex={100} modifiers={[restrictToVerticalAxis]}>
          {activeTask ? (
            <div className="w-full max-w-md opacity-90">
              <TaskCard
                task={activeTask}
                isDragging={true}
                showDragHandle={true}
                onToggleComplete={toggleTaskCompletion}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onUpdateAssignees={updateTaskAssignees}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
