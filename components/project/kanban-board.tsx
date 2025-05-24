'use client';
import { devLog } from '@/lib/utils/logger';

import { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
  closestCorners,
  pointerWithin,
  getFirstCollision,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { StatusColumn } from './status-column';
import { TaskCard } from './task-card';
import { useTaskContext } from './task-context';
import { Task, ProjectStatus } from '@/types/task';
import { sortableKeyboardCoordinates, getActivationConstraint } from '@/lib/dnd-utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface KanbanBoardProps {
  projectId: string;
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onEditStatus?: (status: ProjectStatus) => void;
  onDeleteStatus?: (statusId: string) => void;
  onAddTask?: (statusId: string) => void;
  showAddButton?: boolean;
  emptyStateMessage?: string;
}

/**
 * Kanban board component using @dnd-kit/core for drag and drop
 * Allows dragging tasks between statuses and reordering within a status
 */
export function KanbanBoard({
  projectId,
  onEditTask,
  onDeleteTask,
  onEditStatus,
  onDeleteStatus,
  onAddTask,
  showAddButton = false,
  emptyStateMessage = 'No tasks in this status',
}: KanbanBoardProps) {
  const {
    tasks,
    statuses,
    moveTask,
    toggleTaskCompletion,
    updateTaskAssignees,
    isTasksLoading,
    refreshTasks,
  } = useTaskContext();

  const { toast } = useToast();

  // State for drag operations
  const [activeTaskId, setActiveTaskId] = useState<UniqueIdentifier | null>(null);
  const [activeStatusId, setActiveStatusId] = useState<string | null>(null);
  const [clonedTasks, setClonedTasks] = useState<Task[]>([]);

  // Refs for scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollDirection, setScrollDirection] = useState<'left' | 'right' | null>(null);
  const scrollSpeed = 10;
  const scrollInterval = useRef<NodeJS.Timeout | null>(null);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require the mouse to move by 5px before activating
      activationConstraint: getActivationConstraint(),
    }),
    useSensor(TouchSensor, {
      // Press delay of 250ms, with tolerance of 5px of movement
      activationConstraint: getActivationConstraint(),
    }),
    useSensor(KeyboardSensor, {
      // Customize keyboard shortcuts
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Helper function to get tasks by status
  const getTasksByStatus = (statusId: string) => {
    // During drag operations, use the cloned tasks to show optimistic updates
    const tasksToUse = activeTaskId ? clonedTasks : tasks;
    return tasksToUse.filter(task => task.statusId === statusId);
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

    // Handle dragging over a status column
    if (over.data.current?.type === 'status' && activeTask) {
      const overId = over.id.toString();

      // If dragging over a different status than the task is currently in
      if (activeTask.statusId !== overId) {
        setActiveStatusId(overId);

        // Update the cloned tasks for optimistic UI updates
        setClonedTasks(prev =>
          prev.map(task => (task.id === activeTask.id ? { ...task, statusId: overId } : task))
        );

        // Log for debugging
        devLog(`Dragging over status column: ${overId}`);
      }
    }

    // Handle dragging over another task
    if (over.data.current?.type === 'task' && activeTask) {
      const overTask = over.data.current.task as Task;

      // If dragging over a task in a different status
      if (activeTask.statusId !== overTask.statusId) {
        setActiveStatusId(overTask.statusId || null);

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

    try {
      // If dropping onto a status column
      if (over.data.current?.type === 'status') {
        const newStatusId = over.id.toString();
        devLog(`Dropping onto status column: ${newStatusId}`);

        // If the status is changing
        if (activeTaskData.statusId !== newStatusId) {
          devLog(`Moving task ${activeTaskData.id} to status ${newStatusId}`);
          // No target task ID needed when dropping onto an empty column
          await moveTask(activeTaskData.id, newStatusId);
        }
      }
      // If dropping onto another task
      else if (over.data.current?.type === 'task') {
        const overTaskData = over.data.current.task as Task;

        // If dropping onto a task in a different status
        if (activeTaskData.statusId !== overTaskData.statusId) {
          // Moving to different status column AND positioning relative to a specific task
          await moveTask(activeTaskData.id, overTaskData.statusId || '', overTaskData.id);
        }
        // If dropping onto a task in the same status (reordering)
        else if (activeTaskData.id !== overTaskData.id) {
          // Only reordering within the same status
          await moveTask(activeTaskData.id, activeTaskData.statusId || '', overTaskData.id);
        }
      }
    } catch (error) {
      console.error('Error during drag and drop:', error);
      toast({
        title: 'Error moving task',
        description: 'There was a problem moving the task. Please try again.',
        variant: 'destructive',
      });

      // Force a complete refresh of tasks to ensure consistency
      try {
        if (activeTaskData) {
          toast({
            title: 'Refreshing task data',
            description: 'Synchronizing with the server...',
          });

          // Explicitly refresh tasks to recover from the error
          await refreshTasks();
        }
      } catch (refreshError) {
        console.error('Error refreshing tasks after failed drag and drop:', refreshError);
        // Last resort - try one more time after a delay
        setTimeout(() => {
          refreshTasks().catch(e => console.error('Final attempt to refresh tasks failed:', e));
        }, 2000);
      }
    } finally {
      setActiveTaskId(null);
      setActiveStatusId(null);
      setClonedTasks([]);
    }
  };

  // Handle scrolling during drag
  const startScrolling = (direction: 'left' | 'right') => {
    if (scrollInterval.current) return;

    setScrollDirection(direction);
    scrollInterval.current = setInterval(() => {
      if (scrollContainerRef.current) {
        const scrollAmount = direction === 'left' ? -scrollSpeed : scrollSpeed;
        scrollContainerRef.current.scrollLeft += scrollAmount;
      }
    }, 16); // ~60fps
  };

  const stopScrolling = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
    setScrollDirection(null);
  };

  // Clean up scroll interval on unmount
  useEffect(() => {
    return () => {
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
      }
    };
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
      onDragCancel={() => {
        setActiveTaskId(null);
        setActiveStatusId(null);
        setClonedTasks([]);
      }}
    >
      <div
        className="h-auto max-h-[calc(100vh-240px)] min-h-[500px] overflow-hidden relative"
        style={{ contain: 'paint' }}
      >
        {/* Mobile navigation buttons for scrolling columns */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 md:hidden">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft -= 300;
              }
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Scroll left</span>
          </Button>
        </div>

        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 md:hidden">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft += 300;
              }
            }}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Scroll right</span>
          </Button>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto pb-4 gap-3 h-full pr-2 sm:pr-4 pl-1 -ml-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent touch-pan-x"
          aria-label="Kanban board columns"
          style={{ paddingBottom: '16px', scrollBehavior: 'smooth' }}
        >
          {statuses
            .sort((a, b) => a.order - b.order)
            .map(status => (
              <div
                key={status.id}
                className="flex-1 min-w-[300px] bg-gray-50 rounded-lg p-4 w-[300px]"
              >
                <StatusColumn
                  status={status}
                  tasks={getTasksByStatus(status.id)}
                  onToggleComplete={toggleTaskCompletion}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onUpdateAssignees={updateTaskAssignees}
                  onEditStatus={onEditStatus}
                  onDeleteStatus={onDeleteStatus}
                  onAddTask={onAddTask}
                  emptyStateMessage={emptyStateMessage}
                />
              </div>
            ))}
        </div>
      </div>

      {/* Drag overlay for the currently dragged task */}
      <DragOverlay adjustScale zIndex={100} modifiers={[restrictToWindowEdges]}>
        {activeTask ? (
          <div className="w-[220px] xs:w-[260px] sm:w-[300px] md:w-[320px] opacity-90">
            <TaskCard
              task={activeTask}
              isDragging={true}
              showDragHandle={true}
              onToggleComplete={toggleTaskCompletion}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onUpdateAssignees={updateTaskAssignees}
              className="h-[100px] w-full"
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
