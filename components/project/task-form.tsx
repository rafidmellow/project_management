'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO } from 'date-fns';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { ProjectStatus } from '@/types/project';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface TaskFormProps {
  projectId: string;
  taskId?: string;
  parentId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']),
  startDate: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val ? val : null)),
  endDate: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val ? val : null)),
  dueDate: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val ? val : null)),
  estimatedTime: z
    .union([z.coerce.number().min(0).optional().nullable(), z.literal('')])
    .optional()
    .nullable()
    .transform(val => (val === '' ? null : val)),
  timeSpent: z
    .union([z.coerce.number().min(0).optional().nullable(), z.literal('')])
    .optional()
    .nullable()
    .transform(val => (val === '' ? null : val)),
  statusId: z.string().optional().nullable(),
  // assignedToId is completely deprecated - not included in the schema
  // Use assigneeIds as the primary way to assign tasks
  assigneeIds: z.array(z.string()).optional(),
  parentId: z.string().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export function TaskForm({ projectId, taskId, parentId, onSuccess, onCancel }: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!!taskId);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [parentTasks, setParentTasks] = useState<{ id: string; title: string }[]>([]);
  const { toast } = useToast();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      startDate: null,
      endDate: null,
      dueDate: null,
      estimatedTime: null,
      timeSpent: null,
      statusId: null,
      assigneeIds: [],
      parentId: parentId || null,
    },
  });

  // Fetch project statuses
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/statuses`);
        if (!response.ok) throw new Error('Failed to fetch statuses');

        const data = await response.json();
        setStatuses(data.statuses || []);

        // Set default status if available and creating a new task
        if (!taskId && data.statuses && data.statuses.length > 0) {
          const defaultStatus = data.statuses.find((s: ProjectStatus) => s.isDefault);
          form.setValue('statusId', defaultStatus ? defaultStatus.id : data.statuses[0].id);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch project statuses',
          variant: 'destructive',
        });
      }
    };

    if (projectId) {
      fetchStatuses();
    }
  }, [projectId, taskId, form, toast]);

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch(`/api/team-management?projectId=${projectId}`);
        if (!response.ok) throw new Error('Failed to fetch team members');

        const data = await response.json();

        if (data.teamMembers && Array.isArray(data.teamMembers)) {
          // Extract user data from team members and filter out any null values
          const users = data.teamMembers
            .map((tm: { user: User }) => tm.user)
            .filter((user: User | null) => user && user.id);

          console.log(`Fetched ${users.length} team members for task assignment`);
          setTeamMembers(users);
        } else {
          console.error('No team members data found:', data);
          setTeamMembers([]);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch team members',
          variant: 'destructive',
        });
      }
    };

    if (projectId) {
      fetchTeamMembers();
    }
  }, [projectId, toast]);

  // Fetch parent tasks (top-level tasks for this project)
  useEffect(() => {
    const fetchParentTasks = async () => {
      try {
        const response = await fetch(`/api/tasks?projectId=${projectId}&parentId=null`);
        if (!response.ok) throw new Error('Failed to fetch tasks');

        const data = await response.json();
        // Filter out the current task if editing
        const filteredTasks = taskId
          ? data.tasks.filter((t: { id: string; title: string }) => t.id !== taskId)
          : data.tasks;

        setParentTasks(
          filteredTasks.map((t: { id: string; title: string }) => ({ id: t.id, title: t.title }))
        );
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch potential parent tasks',
          variant: 'destructive',
        });
      }
    };

    if (projectId) {
      fetchParentTasks();
    }
  }, [projectId, taskId, toast]);

  // Fetch task data if editing
  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return;

      try {
        setIsFetching(true);
        const response = await fetch(`/api/tasks/${taskId}`);
        if (!response.ok) throw new Error('Failed to fetch task');

        const data = await response.json();
        const task = data.task;

        console.log('Fetched task data:', task);

        // Extract assignee IDs from the task
        const assigneeIds = task.assignees?.map((a: { userId: string }) => a.userId) || [];
        console.log('Extracted assignee IDs:', assigneeIds);

        if (task) {
          // Format dates as YYYY-MM-DD for HTML date inputs
          const formatDateForInput = (dateString: string | null): string | null => {
            if (!dateString) return null;
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
          };

          form.reset({
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            startDate: formatDateForInput(task.startDate),
            endDate: formatDateForInput(task.endDate),
            dueDate: formatDateForInput(task.dueDate),
            estimatedTime: task.estimatedTime,
            timeSpent: task.timeSpent,
            statusId: task.statusId,
            assigneeIds: assigneeIds,
            parentId: task.parentId,
          });
        }
      } catch (error) {
        console.error('Error fetching task:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch task details',
          variant: 'destructive',
        });
      } finally {
        setIsFetching(false);
      }
    };

    if (taskId) {
      fetchTask();
    }
  }, [taskId, form, toast]);

  const onSubmit = async (values: TaskFormValues): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('Form submission started with values:', values);

      const endpoint = taskId ? `/api/tasks/${taskId}` : '/api/tasks';

      const method = taskId ? 'PATCH' : 'POST';

      // Format data for submission
      const payload: {
        [key: string]: string | string[] | number | null | undefined;
      } = {
        ...values,
        projectId: !taskId ? projectId : undefined,
        // Ensure these are properly formatted for the API
        estimatedTime: values.estimatedTime === '' ? null : values.estimatedTime,
        timeSpent: values.timeSpent === '' ? null : values.timeSpent,
        // Make sure assigneeIds is an array
        assigneeIds: Array.isArray(values.assigneeIds) ? values.assigneeIds : [],
        // Format dates - ensure they're properly formatted ISO strings
        startDate: values.startDate ? new Date(values.startDate).toISOString() : null,
        endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      };

      console.log('Submitting task with dates:', {
        startDate: payload.startDate,
        endDate: payload.endDate,
        dueDate: payload.dueDate,
      });

      // Log assignee information
      console.log('Assignee IDs being submitted:', values.assigneeIds);
      console.log(
        'Team members available:',
        teamMembers.map(m => ({ id: m.id, name: m.name || m.email }))
      );
      console.log('Submitting task data:', payload);

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Failed to parse error response' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to save task');
      }

      const result = await response.json();
      console.log('Task form submission result:', result);

      // Try to refresh the task context if we're in a project context
      try {
        // Find the TaskContext and refresh tasks
        const taskContextRefreshEvent = new CustomEvent('refreshTasks', {
          detail: { projectId },
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(taskContextRefreshEvent);
          console.log('Dispatched refreshTasks event');
        }
      } catch (refreshError) {
        console.warn('Could not refresh task context:', refreshError);
      }

      toast({
        title: taskId ? 'Task updated' : 'Task created',
        description: taskId
          ? 'The task has been updated successfully'
          : 'The task has been created successfully',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      console.error('Error during form submission:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save task',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Task title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Task description"
                  className="min-h-[100px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="statusId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || undefined}
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status.id} value={status.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          {status.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value || ''}
                    onChange={e => {
                      field.onChange(e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value || ''}
                    onChange={e => {
                      field.onChange(e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value || ''}
                    onChange={e => {
                      field.onChange(e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <FormField
            control={form.control}
            name="estimatedTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Time (hours)</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="0"
                      {...field}
                      value={field.value === null ? '' : field.value}
                    />
                    <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeSpent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Spent (hours)</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="0"
                      {...field}
                      value={field.value === null ? '' : field.value}
                    />
                    <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="assigneeIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assignees</FormLabel>
              <FormControl>
                <MultiSelect
                  options={teamMembers.map(member => ({
                    label: member.name || member.email,
                    value: member.id,
                  }))}
                  selected={field.value || []}
                  onChange={field.onChange}
                  placeholder="Select assignees"
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {parentTasks.length > 0 && (
          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Task (optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || undefined}
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent task" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None (Top-level task)</SelectItem>
                    {parentTasks.map(task => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Making this a subtask will nest it under the selected parent task.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-2">
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
            {taskId ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
