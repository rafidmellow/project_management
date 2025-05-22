'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/date-picker';
import { MultiSelect } from '@/components/ui/multi-select';
import { useProjects } from '@/hooks/use-data';
import { taskApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useUsers } from '@/hooks/use-users';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTaskValues, createTaskSchema } from '@/lib/validations/task';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  parentId?: string;
  onSuccess?: () => void;
}

export function TaskCreateModal({
  isOpen,
  onClose,
  projectId,
  parentId,
  onSuccess,
}: TaskCreateModalProps) {
  const router = useRouter();
  const { projects } = useProjects(1, 100);
  const { users } = useUsers({ limit: 100 });
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentTask, setParentTask] = useState<any>(null);
  const [loadingParent, setLoadingParent] = useState(false);

  const form = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      projectId: projectId || '',
      priority: 'medium',
      description: '',
      assigneeIds: [],
      dueDate: null,
      startDate: null,
      endDate: null,
      estimatedTime: null,
      timeSpent: null,
      statusId: null,
      parentId: parentId || null,
    },
  });

  // Fetch parent task details if parentId is provided
  useEffect(() => {
    if (parentId) {
      const fetchParentTask = async () => {
        try {
          setLoadingParent(true);
          const response = await taskApi.getTask(parentId);
          setParentTask(response.task);

          // Set project ID to match parent task's project
          if (response.task?.projectId) {
            form.setValue('projectId', response.task.projectId);
            form.setValue('parentId', parentId);
          }
        } catch (err) {
          console.error('Failed to load parent task details:', err);
        } finally {
          setLoadingParent(false);
        }
      };
      fetchParentTask();
    }
  }, [parentId, form]);

  const onSubmit = async (data: CreateTaskValues) => {
    // Format date fields before sending to API
    const dataToSend = {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
    };

    try {
      setIsSubmitting(true);
      const result = await taskApi.createTask(dataToSend);

      toast({
        title: 'Success',
        description: 'Task has been created successfully',
      });

      // Reset form and close modal
      form.reset();
      onClose();

      // Call the success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Task creation error:', error);

      let errorMessage = 'Failed to create task';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{parentTask ? 'Create Subtask' : 'New Task'}</DialogTitle>
          <DialogDescription>
            {parentTask
              ? `Add a subtask to "${parentTask.title}"`
              : 'Enter the details of the new task'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Task Title</Label>
            <Input id="title" placeholder="Enter the task title" {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the task"
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="projectId">Project</Label>
            <Select
              onValueChange={value => form.setValue('projectId', value)}
              value={form.watch('projectId')}
              disabled={!!parentTask}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {parentTask && (
              <p className="text-xs text-muted-foreground mt-1">
                Subtasks must belong to the same project as their parent task.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="assigneeIds">Assigned to</Label>
            <MultiSelect
              options={users.map(user => ({
                label: user.name || user.email,
                value: user.id,
              }))}
              selected={form.watch('assigneeIds') || []}
              onChange={value => form.setValue('assigneeIds', value)}
              placeholder="Select team members..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              You can assign multiple users to this task
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <DatePicker
              onSelect={date => form.setValue('dueDate', date ? date.toISOString() : null)}
              selected={form.watch('dueDate')}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              onValueChange={value => form.setValue('priority', value as 'low' | 'medium' | 'high')}
              value={form.watch('priority')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Display parent task info if this is a subtask */}
          {parentTask && (
            <div className="bg-muted/30 p-4 rounded-md border">
              <h3 className="text-sm font-medium mb-2">Parent Task</h3>
              <div className="flex items-center gap-2">
                <span className="font-medium">{parentTask.title}</span>
              </div>
              {parentTask.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {parentTask.description}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
