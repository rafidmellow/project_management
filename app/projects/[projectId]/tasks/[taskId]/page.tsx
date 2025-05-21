'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Trash,
  CheckCircle,
  XCircle,
  MessageSquare,
  Paperclip,
  Users,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskForm } from '@/components/project/task-form';
import { TimeTracker } from '@/components/project/time-tracker';
import { format } from 'date-fns';
import { safeFormat } from '@/lib/utils/date';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Task, TaskAssignee, TaskWithRelations } from '@/types/task';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const taskId = params.taskId as string;
  const [task, setTask] = useState<TaskWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Fetch task data
  useEffect(() => {
    const fetchTask = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/tasks/${taskId}?includeSubtasks=true`);

        if (!response.ok) {
          throw new Error('Failed to fetch task');
        }

        const data = await response.json();
        setTask(data.task);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch task details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  const handleEditTask = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    // Refresh task data
    fetchTask();
  };

  const handleDeleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      toast({
        title: 'Task deleted',
        description: 'The task has been deleted successfully',
      });

      // Navigate back to the project page
      router.push(`/projects/${projectId}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleCompletion = async () => {
    try {
      // Optimistically update the UI
      setTask(prev => (prev ? { ...prev, completed: !prev.completed } : null));

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: task ? !task.completed : false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      // Refresh task data
      fetchTask();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task completion status',
        variant: 'destructive',
      });
      // Revert the optimistic update
      fetchTask();
    }
  };

  const handleTimeUpdate = (newTime: number) => {
    // Update the task's time spent in the UI
    setTask(prev => (prev ? { ...prev, timeSpent: newTime } : null));
  };

  // Fetch task data (defined here to be used in multiple places)
  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}?includeSubtasks=true`);

      if (!response.ok) {
        throw new Error('Failed to fetch task');
      }

      const data = await response.json();
      setTask(data.task);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch task details',
        variant: 'destructive',
      });
    }
  };

  // Format date for display
  const formatDate = (dateString?: string | Date | null) => {
    return safeFormat(dateString, 'MMM d, yyyy', 'Not set');
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Task not found</h2>
        <p className="text-muted-foreground mt-2">
          The task you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button asChild className="mt-4">
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Link>
        </Button>

        {task.parent && (
          <>
            <span className="text-muted-foreground">/</span>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/projects/${projectId}/tasks/${task.parent.id}`}>
                {task.parent.title}
              </Link>
            </Button>
          </>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleCompletion}
                className="h-6 w-6"
              >
                {task.completed ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-muted-foreground" />
                )}
              </Button>
            </div>
            <div>
              <h1
                className={`text-3xl font-bold tracking-tight ${task.completed ? 'line-through text-muted-foreground' : ''}`}
              >
                {task.title}
              </h1>

              <div className="flex flex-wrap gap-2 mt-2">
                {task.status && (
                  <div
                    className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                    style={{
                      backgroundColor: `${task.status.color}20`,
                      color: task.status.color,
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: task.status.color }}
                    />
                    {task.status.name}
                  </div>
                )}

                <Badge variant="outline" className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>

                {task.dueDate && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due: {formatDate(task.dueDate)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={handleEditTask}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteTask}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Trash className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {task.assignees && task.assignees.length > 0 ? (
            <div className="flex -space-x-2">
              {task.assignees.map(assignee => (
                <Avatar key={assignee.id} className="border border-black">
                  <AvatarImage src={assignee.user.image || undefined} />
                  <AvatarFallback>
                    {assignee.user.name?.substring(0, 2) || assignee.user.email.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={handleEditTask}>
              <Users className="mr-2 h-4 w-4" />
              Assign
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {task.description ? (
                <div className="prose max-w-none">{task.description}</div>
              ) : (
                <p className="text-muted-foreground">No description provided.</p>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="subtasks" className="space-y-6">
            <TabsList>
              <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
            </TabsList>

            <TabsContent value="subtasks">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Subtasks</CardTitle>
                  <Button size="sm" onClick={handleEditTask}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subtask
                  </Button>
                </CardHeader>
                <CardContent>
                  {task.subtasks && task.subtasks.length > 0 ? (
                    <div className="space-y-2">
                      {task.subtasks.map(subtask => (
                        <div
                          key={subtask.id}
                          className="flex items-center justify-between p-3 border rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <div>
                              {subtask.completed ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <Link
                                href={`/projects/${projectId}/tasks/${subtask.id}`}
                                className={`font-medium hover:underline ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}
                              >
                                {subtask.title}
                              </Link>
                              {subtask.dueDate && (
                                <p className="text-xs text-muted-foreground">
                                  Due: {formatDate(subtask.dueDate)}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className={getPriorityColor(subtask.priority)}>
                            {subtask.priority}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No subtasks yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-2 text-muted-foreground">
                        Comments will be implemented in a future update.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachments">
              <Card>
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Paperclip className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-2 text-muted-foreground">
                        Attachments will be implemented in a future update.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <TimeTracker
            taskId={taskId}
            initialTimeSpent={task.timeSpent}
            onTimeUpdate={handleTimeUpdate}
          />

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Project</dt>
                  <dd className="mt-1">
                    <Link href={`/projects/${task.project.id}`} className="hover:underline">
                      {task.project.title}
                    </Link>
                  </dd>
                </div>

                {task.status && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                    <dd className="mt-1 flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: task.status.color }}
                      />
                      {task.status.name}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Priority</dt>
                  <dd className="mt-1">
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </dd>
                </div>

                {(task.startDate || task.endDate || task.dueDate) && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Dates</dt>
                    <dd className="mt-1 space-y-1">
                      {task.startDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Start:</span> {formatDate(task.startDate)}
                        </div>
                      )}
                      {task.endDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">End:</span> {formatDate(task.endDate)}
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Due:</span> {formatDate(task.dueDate)}
                        </div>
                      )}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Time</dt>
                  <dd className="mt-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Spent:</span> {task.timeSpent || 0} hours
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Estimated:</span> {task.estimatedTime || 0}{' '}
                      hours
                    </div>
                    {task.estimatedTime && task.estimatedTime > 0 && (
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${Math.min(100, ((task.timeSpent || 0) / task.estimatedTime) * 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                  <dd className="mt-1 text-sm">
                    {format(new Date(task.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                  <dd className="mt-1 text-sm">
                    {format(new Date(task.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent
          className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6"
          style={{ zIndex: 100 }}
        >
          <DialogHeader className="mb-4">
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            projectId={projectId}
            taskId={taskId}
            onSuccess={handleEditDialogClose}
            onCancel={handleEditDialogClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
