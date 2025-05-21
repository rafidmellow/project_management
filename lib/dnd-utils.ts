import { KeyboardCoordinateGetter } from '@dnd-kit/core';
import { sortableKeyboardCoordinates as defaultSortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Task, Column } from '@/types';

/**
 * Enhanced keyboard coordinates getter with custom behavior
 * Extends the default implementation with additional keyboard shortcuts
 */
export const sortableKeyboardCoordinates: KeyboardCoordinateGetter = (event, { context }) => {
  // Use the default implementation as a base
  const coordinates = defaultSortableKeyboardCoordinates(event, { context });

  // Add custom keyboard shortcuts or behavior here
  // For example, we could add support for Home/End keys

  return coordinates;
};

/**
 * Helper to determine if we're on a touch device
 * Used to provide different activation constraints based on input method
 */
export function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Custom activation constraints for different devices
 * - Touch devices: minimal delay with increased tolerance for better responsiveness
 * - Mouse: very small distance requirement for immediate activation
 */
export function getActivationConstraint() {
  return isTouchDevice()
    ? { delay: 100, tolerance: 10 } // Touch devices: minimal delay with increased tolerance
    : { distance: 1 }; // Mouse: very small distance requirement for immediate activation
}

/**
 * Determines if an element is a scroll container
 * Used to improve drag behavior when dragging within scrollable containers
 */
export function isScrollContainer(element: HTMLElement | null): boolean {
  if (!element) return false;

  const { overflow, overflowY, overflowX } = window.getComputedStyle(element);
  return (
    overflow === 'auto' ||
    overflow === 'scroll' ||
    overflowY === 'auto' ||
    overflowY === 'scroll' ||
    overflowX === 'auto' ||
    overflowX === 'scroll'
  );
}

/**
 * Finds the closest scroll container parent of an element
 * Used to implement auto-scrolling during drag operations
 */
export function getScrollContainer(element: HTMLElement | null): HTMLElement | null {
  if (!element) return null;

  if (isScrollContainer(element)) {
    return element;
  }

  return getScrollContainer(element.parentElement);
}

/**
 * Generates a unique ID for drag items
 * Useful when you need to create unique identifiers for drag items
 */
export function generateDragId(prefix: string, id: string): string {
  return `${prefix}-${id}`;
}

/**
 * Extracts the original ID from a drag ID
 * Reverses the generateDragId function
 */
export function extractIdFromDragId(dragId: string): string {
  const parts = dragId.split('-');
  return parts.slice(1).join('-');
}

/**
 * Creates a safe click handler that stops event propagation
 * Useful for interactive elements inside draggable components
 *
 * @param handler The original click handler function
 * @returns A new function that stops propagation and calls the original handler
 */
export function createSafeClickHandler<T>(
  handler: ((event: React.MouseEvent<T>) => void) | undefined
): (event: React.MouseEvent<T>) => void {
  return (event: React.MouseEvent<T>) => {
    // Always stop propagation to prevent drag activation
    event.stopPropagation();

    // Call the original handler if it exists
    if (handler) {
      handler(event);
    }
  };
}

export type TaskDragData = {
  type: 'task';
  task: Task;
  columnId: string;
};

export type ColumnDragData = {
  type: 'column';
  column: Column;
};

export function handleDragStart(event: DragStartEvent) {
  const { active } = event;
  const data = active.data.current as TaskDragData | ColumnDragData;

  if (data.type === 'task') {
    document.body.style.cursor = 'grabbing';
  }
}

export function handleDragEnd(event: DragEndEvent) {
  document.body.style.cursor = '';
}

export function handleDragOver(event: DragOverEvent) {
  const { active, over } = event;
  if (!over) return;

  const activeData = active.data.current as TaskDragData;
  const overData = over.data.current as TaskDragData;

  if (!activeData || !overData) return;

  // If dragging over a different column
  if (activeData.columnId !== overData.columnId) {
    return {
      type: 'move-between-columns',
      taskId: activeData.task.id,
      sourceColumnId: activeData.columnId,
      targetColumnId: overData.columnId,
      overTaskId: overData.task.id,
    };
  }

  // If reordering within the same column
  if (active.id !== over.id) {
    return {
      type: 'reorder',
      taskId: activeData.task.id,
      columnId: activeData.columnId,
      overTaskId: overData.task.id,
    };
  }
}

export function reorderTasks(tasks: Task[], activeId: string, overId: string): Task[] {
  const oldIndex = tasks.findIndex(task => task.id === activeId);
  const newIndex = tasks.findIndex(task => task.id === overId);

  return arrayMove(tasks, oldIndex, newIndex);
}

export function moveTaskBetweenColumns(
  sourceColumn: Column,
  targetColumn: Column,
  taskId: string,
  overTaskId: string
): { sourceColumn: Column; targetColumn: Column } {
  const task = sourceColumn.tasks.find(t => t.id === taskId);
  if (!task) return { sourceColumn, targetColumn };

  const sourceTasks = sourceColumn.tasks.filter(t => t.id !== taskId);
  const overIndex = targetColumn.tasks.findIndex(t => t.id === overTaskId);

  const targetTasks = [...targetColumn.tasks];
  targetTasks.splice(overIndex, 0, { ...task, status: targetColumn.id });

  return {
    sourceColumn: { ...sourceColumn, tasks: sourceTasks },
    targetColumn: { ...targetColumn, tasks: targetTasks },
  };
}
