'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useTaskContext } from './task-context';
import { StatusListViewDndKit } from './status-list-view-dndkit';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProjectStatus } from '@/types/project';

interface StatusListViewProps {
  projectId: string;
  onEditTask?: (taskId: string) => void;
}

/**
 * StatusListView component that uses the DND Kit implementation
 * This is a wrapper around StatusListViewDndKit that handles status and task management
 */
export function StatusListView({ projectId, onEditTask }: StatusListViewProps) {
  const { tasks, statuses, isLoading, refreshTasks, deleteTask } = useTaskContext();

  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingStatusName, setEditingStatusName] = useState<string>('');
  const [deleteStatusId, setDeleteStatusId] = useState<string | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const statusInputRef = useRef<HTMLInputElement>(null);

  // Start editing a status
  const handleEditStatus = (status: ProjectStatus) => {
    setEditingStatusId(status.id);
    setEditingStatusName(status.name);
  };

  // Save edited status
  const handleSaveStatusName = async () => {
    if (!editingStatusId) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/statuses/${editingStatusId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingStatusName }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh tasks to get updated status
      await refreshTasks();

      // Reset editing state
      setEditingStatusId(null);
      setEditingStatusName('');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingStatusId(null);
    setEditingStatusName('');
  };

  // Delete status
  const handleDeleteStatus = async () => {
    if (!deleteStatusId) return;

    try {
      // Check if status has tasks
      const tasksInStatus = tasks.filter(task => task.statusId === deleteStatusId);

      if (tasksInStatus.length > 0) {
        setDeleteStatusId(null);
        return;
      }

      const response = await fetch(`/api/projects/${projectId}/statuses/${deleteStatusId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete status');
      }

      // Refresh tasks to get updated statuses
      await refreshTasks();
    } catch (error) {
      console.error('Error deleting status:', error);
    } finally {
      setDeleteStatusId(null);
    }
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;

    try {
      await deleteTask(deleteTaskId);
    } finally {
      setDeleteTaskId(null);
    }
  };

  // Handle adding a new task
  const handleAddTask = (statusId: string) => {
    // Find the status to get its name
    const status = statuses.find(s => s.id === statusId);
    if (!status) return;

    // Open the quick task dialog
    // This is handled by rendering the QuickTaskDialogNew component
    // with the appropriate props
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (statuses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center mb-4">
            No statuses defined for this project. Create statuses to start organizing tasks.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <StatusListViewDndKit
        projectId={projectId}
        onEditTask={onEditTask}
        onDeleteTask={taskId => setDeleteTaskId(taskId)}
        onEditStatus={handleEditStatus}
        onDeleteStatus={statusId => setDeleteStatusId(statusId)}
        onAddTask={handleAddTask}
      />

      {/* Delete status confirmation dialog */}
      <AlertDialog open={!!deleteStatusId} onOpenChange={() => setDeleteStatusId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this status? This action cannot be undone.
              {tasks.some(task => task.statusId === deleteStatusId) && (
                <p className="text-destructive mt-2 font-medium">
                  This status contains tasks. Move or delete them first.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStatus}
              disabled={tasks.some(task => task.statusId === deleteStatusId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete task confirmation dialog */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit status dialog */}
      {editingStatusId && (
        <AlertDialog open={!!editingStatusId} onOpenChange={() => handleCancelEdit()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Status</AlertDialogTitle>
              <AlertDialogDescription>Update the name of this status.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-center gap-2 py-4">
              <Input
                ref={statusInputRef}
                value={editingStatusName}
                onChange={e => setEditingStatusName(e.target.value)}
                className="flex-1"
                placeholder="Status name"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSaveStatusName();
                  }
                }}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelEdit}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSaveStatusName}>Save Changes</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
