import type { Task } from './task';

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
  order?: number;
  color?: string;
}

export interface TaskDragData {
  task: Task;
  columnId: string;
  type: 'task' | 'status';
}

export interface KanbanBoardProps {
  projectId: string;
  columns?: Column[];
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onEditStatus?: (status: any) => void;
  onDeleteStatus?: (statusId: string) => void;
  onAddTask?: (statusId?: string) => void;
  onUpdateTask?: (taskId: string) => void;
  onReorderTasks?: () => void;
  onMoveTask?: () => void;
  onError?: () => void;
  showAddButton?: boolean;
  emptyStateMessage?: string;
}

export interface KanbanViewProps {
  columns: Column[];
  onAddTask?: (columnId: string, task: Partial<Task>) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onReorderTasks: (columnId: string, tasks: Task[]) => Promise<void>;
  onMoveTask: (taskId: string, sourceColumnId: string, targetColumnId: string) => Promise<void>;
  onError?: (error: Error) => void;
  showAddButton?: boolean;
  emptyStateMessage?: string;
}

export interface TaskBoardProps extends KanbanViewProps {
  defaultView?: 'kanban' | 'list';
}
