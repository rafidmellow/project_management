'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Settings,
  Calendar,
  Clock,
  Users,
  BarChart2,
  UserPlus,
  Trash2,
  UserMinus,
} from 'lucide-react';
import { useRemoveTeamMember } from '@/hooks/use-team-management';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { KanbanBoard } from '@/components/project/kanban-board';
import { StatusListView } from '@/components/project/status-list-view';
import { TaskProvider, useTaskContext } from '@/components/project/task-context';
import { TaskFilterNew } from '@/components/project/task-filter';
import { TaskFilters } from '@/types/task';
import { ProjectSettingsDialog } from '@/components/project/project-settings-dialog';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskForm } from '@/components/project/task-form';
import { AddTeamMemberDialog } from '@/components/project/add-team-member-dialog';
import { format } from 'date-fns';
import { safeFormat } from '@/lib/utils/date';
import { CreateStatusDialogNew } from '@/components/project/create-status-dialog';
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
import { Project, ProjectStatus } from '@/types/project';
import { Task } from '@/types/task';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board');
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [taskFilters, setTaskFilters] = useState<TaskFilters>({
    search: '',
    statusIds: [],
    assigneeIds: [],
    priority: null,
    completed: null,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [userToRemove, setUserToRemove] = useState<any>(null);
  const [isRemovingUser, setIsRemovingUser] = useState(false);
  const { toast } = useToast();

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }

        const data = await response.json();
        setProject(data.project);
        setStatuses(data.project.statuses || []);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch project details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  // Fetch tasks data
  const fetchTasks = async () => {
    try {
      setIsTasksLoading(true);
      const response = await fetch(`/api/tasks?projectId=${projectId}&limit=100`);

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch tasks',
        variant: 'destructive',
      });
    } finally {
      setIsTasksLoading(false);
    }
  };

  // Load tasks on component mount and when project changes
  useEffect(() => {
    if (projectId) {
      fetchTasks();
      fetchUsers();
    }
  }, [projectId]);

  // Fetch users for the project
  const fetchUsers = async () => {
    try {
      console.log('Fetching team members for project:', projectId);
      const response = await fetch(`/api/team-management?projectId=${projectId}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(
          `Failed to fetch project members: ${errorData.error || response.statusText}`
        );
      }

      const data = await response.json();
      console.log('Team members API response:', data);

      // Check if we have team members data
      if (data.teamMembers && Array.isArray(data.teamMembers)) {
        // Extract user data from team members
        const usersList = data.teamMembers.map((member: any) => member.user).filter(Boolean);
        console.log('Fetched users:', usersList.length);
        setUsers(usersList);
      } else {
        console.error('No team members data found:', data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch team members',
        variant: 'destructive',
      });
    }
  };

  // Filter tasks based on current filters
  useEffect(() => {
    if (tasks.length === 0) {
      setFilteredTasks([]);
      return;
    }

    let filtered = [...tasks];

    // Filter by search term
    if (taskFilters.search) {
      const searchTerm = taskFilters.search.toLowerCase();
      filtered = filtered.filter(
        task =>
          task.title.toLowerCase().includes(searchTerm) ||
          (task.description && task.description.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by status
    if (taskFilters.statusIds.length > 0) {
      filtered = filtered.filter(
        task => task.statusId && taskFilters.statusIds.includes(task.statusId)
      );
    }

    // Filter by assignee
    if (taskFilters.assigneeIds.length > 0) {
      filtered = filtered.filter(
        task =>
          task.assignees &&
          task.assignees.some(assignee => taskFilters.assigneeIds.includes(assignee.user.id))
      );
    }

    // Filter by priority
    if (taskFilters.priority) {
      filtered = filtered.filter(
        task => task.priority.toLowerCase() === taskFilters.priority?.toLowerCase()
      );
    }

    // Filter by completion status
    if (taskFilters.completed !== null) {
      filtered = filtered.filter(task => task.completed === taskFilters.completed);
    }

    setFilteredTasks(filtered);
  }, [tasks, taskFilters]);

  const handleCreateTask = () => {
    setEditingTaskId(null);
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId);
    setIsTaskDialogOpen(true);
  };

  const handleTaskDialogClose = async () => {
    setIsTaskDialogOpen(false);
    setEditingTaskId(null);
    // Refresh tasks after creating or editing
    await fetchTasks();
  };

  // Use the removeTeamMember hook
  const {
    removeTeamMember,
    isRemoving: isRemovingMember,
    error: removeError,
  } = useRemoveTeamMember();

  const handleRemoveTeamMember = async () => {
    if (!userToRemove) return;

    try {
      setIsRemovingUser(true);

      // Find the team member ID for this user in this project
      const response = await fetch(
        `/api/team-management?projectId=${projectId}&userId=${userToRemove.id}`
      );

      if (!response.ok) {
        throw new Error('Failed to find team member');
      }

      const data = await response.json();

      if (!data.teamMembers || data.teamMembers.length === 0) {
        throw new Error('Team member not found');
      }

      const teamMemberId = data.teamMembers[0].id;

      // Remove the team member using the new API
      await removeTeamMember(teamMemberId);

      toast({
        title: 'Team member removed',
        description: `${userToRemove.name || userToRemove.email} has been removed from the project team`,
      });

      // Refresh the team members list
      await fetchUsers();
    } catch (error: unknown) {
      console.error('Error removing team member:', error);
      toast({
        title: 'Error',
        description: (error as Error)?.message || 'Failed to remove team member',
        variant: 'destructive',
      });
    } finally {
      setIsRemovingUser(false);
      setUserToRemove(null);
    }
  };

  // Use the safeFormat function from date-utils.ts instead of local implementation
  const formatDate = (dateString: string | Date | null | undefined) => {
    return safeFormat(dateString, 'MMM d, yyyy', 'Not set');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <p className="text-muted-foreground mt-2">
          The project you're looking for doesn't exist or you don't have access to it.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Project Header - Enhanced for Mobile */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words pr-2 flex-1">
              {project.title}
            </h1>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full mt-1"
              title="Edit Project"
              onClick={() => setIsSettingsDialogOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {project.description && (
            <p className="text-muted-foreground text-sm sm:text-base">{project.description}</p>
          )}

          {/* Project Timeline Summary */}
          <div className="flex flex-wrap gap-3 mt-1">
            {project.startDate && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                <Calendar className="h-3.5 w-3.5" />
                <span>Start: {formatDate(project.startDate)}</span>
              </div>
            )}

            {project.endDate && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                <Calendar className="h-3.5 w-3.5" />
                <span>End: {formatDate(project.endDate)}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
              <Users className="h-3.5 w-3.5" />
              <span>{project._count?.teamMembers || 0} team members</span>
            </div>
          </div>
        </div>
      </div>

      {/* Task Filters - Responsive */}
      <div className="bg-muted/10 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
        <TaskProvider projectId={projectId}>
          <TaskFilterNew />
        </TaskProvider>
      </div>
      {/* Responsive Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-2 sm:mb-4">
          <div className="w-full overflow-x-auto pb-1 -mb-1 no-scrollbar">
            <TabsList className="bg-background w-full sm:w-auto inline-flex">
              <TabsTrigger
                value="board"
                className="flex-1 sm:flex-initial data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-w-[80px]"
              >
                <span className="whitespace-nowrap">Board</span>
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="flex-1 sm:flex-initial data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-w-[80px]"
              >
                <span className="whitespace-nowrap">List</span>
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className="flex-1 sm:flex-initial data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-w-[80px]"
              >
                <span className="whitespace-nowrap">Team</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="flex-1 sm:flex-initial data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-w-[80px]"
              >
                <span className="whitespace-nowrap">Analytics</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {activeTab === 'board' && (
            <div className="w-full sm:w-auto flex justify-end mt-2 sm:mt-0">
              <TaskProvider projectId={projectId}>
                <CreateStatusDialogNew projectId={projectId} />
              </TaskProvider>
            </div>
          )}
        </div>
        <TabsContent value="board">
          <div className="space-y-4">
            <TaskProvider projectId={projectId}>
              <KanbanBoard
                projectId={projectId}
                onEditTask={handleEditTask}
                onDeleteTask={taskId => {
                  // Handle task deletion
                  console.log('Delete task:', taskId);
                }}
                onAddTask={handleCreateTask}
                showAddButton={true}
                emptyStateMessage="No tasks in this status"
              />
            </TaskProvider>
          </div>
        </TabsContent>
        <TabsContent value="list">
          <div className="space-y-4">
            <TaskProvider projectId={projectId}>
              <StatusListView projectId={projectId} onEditTask={handleEditTask} />
            </TaskProvider>
          </div>
        </TabsContent>
        <TabsContent value="team">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Project Creator Card */}
            <Card className="overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Project Creator</CardTitle>
                <CardDescription>The person who created this project</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border border-black shrink-0">
                    {project.createdBy?.image ? (
                      <AvatarImage
                        src={project.createdBy.image}
                        alt={project.createdBy.name || ''}
                      />
                    ) : (
                      <AvatarFallback>
                        {project.createdBy?.name ? project.createdBy.name.charAt(0) : '?'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{project.createdBy?.name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {project.createdBy?.email || ''}
                    </p>
                    {users.some(user => user.id === project.createdBy?.id) && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Also a team member
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Members Card */}
            <Card className="overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Team Members</CardTitle>
                    <CardDescription>People working on this project</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTeamDialogOpen(true)}
                    className="self-start sm:self-center"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    <span className="whitespace-nowrap">Add Members</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <p className="text-sm text-muted-foreground mb-4">
                  {project.createdBy && users.some(user => user.id === project.createdBy?.id)
                    ? (project._count?.teamMembers || 0) - 1
                    : project._count?.teamMembers || 0}{' '}
                  other members assigned to this project
                </p>

                {users.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {users
                      .filter(user => user.id !== project.createdBy?.id)
                      .slice(0, 5)
                      .map(user => (
                        <div key={user.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <Avatar className="h-8 w-8 border border-black shrink-0">
                              {user.image ? (
                                <AvatarImage src={user.image} alt={user.name || ''} />
                              ) : (
                                <AvatarFallback>
                                  {user.name ? user.name.charAt(0) : '?'}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate text-sm sm:text-base">
                                {user.name || 'Unknown'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                          </div>
                          {/* Don't show remove button for project creator */}
                          {user.id !== project.createdBy?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0 ml-1 sm:ml-2"
                              onClick={() => setUserToRemove(user)}
                              title="Remove from team"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}

                    {users.filter(user => user.id !== project.createdBy?.id).length > 5 && (
                      <p className="text-sm text-muted-foreground text-center py-1">
                        + {users.filter(user => user.id !== project.createdBy?.id).length - 5} more
                        members
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {project.createdBy && users.some(user => user.id === project.createdBy?.id)
                      ? 'No additional team members found for this project.'
                      : 'No team members found for this project.'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Progress Card */}
            <Card className="overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Project Progress</CardTitle>
                <CardDescription>Overall completion status of tasks</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {project._count?.tasks
                        ? Math.round(
                            (tasks.filter(t => t.completed).length / project._count.tasks) * 100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-3 sm:h-4 bg-muted rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: project._count?.tasks
                          ? `${Math.round((tasks.filter(t => t.completed).length / project._count.tasks) * 100)}%`
                          : '0%',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 sm:mt-3">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {tasks.filter(t => t.completed).length} / {project._count?.tasks || 0} tasks
                      completed
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card className="overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Project Timeline</CardTitle>
                <CardDescription>Start and end dates for the project</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Start Date</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {formatDate(project.startDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">End Date</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {formatDate(project.endDate)}
                      </p>
                    </div>
                  </div>

                  {project.dueDate && (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Due Date</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {formatDate(project.dueDate)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Time Tracking Card */}
            <Card className="overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Time Tracking</CardTitle>
                <CardDescription>Estimated vs actual time spent</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Estimated Time</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {project.estimatedTime || 0} hours
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Time Spent</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {project.totalTimeSpent || 0} hours
                      </p>
                    </div>
                  </div>

                  {project.estimatedTime && project.totalTimeSpent && (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {Math.min(
                            Math.round((project.totalTimeSpent / project.estimatedTime) * 100),
                            100
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${Math.min(Math.round((project.totalTimeSpent / project.estimatedTime) * 100), 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Task Distribution Card */}
            <Card className="overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Task Distribution</CardTitle>
                <CardDescription>Tasks by status and priority</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="space-y-5 sm:space-y-6">
                  {/* Tasks by Status */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tasks by Status</h4>
                    <div className="space-y-2">
                      {statuses.map(status => {
                        const statusTasks = tasks.filter(t => t.statusId === status.id);
                        const percentage = project._count?.tasks
                          ? Math.round((statusTasks.length / project._count.tasks) * 100)
                          : 0;

                        return (
                          <div key={status.id} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                                <div
                                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: status.color }}
                                />
                                <span className="text-xs sm:text-sm truncate">{status.name}</span>
                              </div>
                              <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap ml-1">
                                {statusTasks.length} tasks ({percentage}%)
                              </span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: status.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tasks by Priority */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tasks by Priority</h4>
                    <div className="space-y-2">
                      {['high', 'medium', 'low'].map(priority => {
                        const priorityTasks = tasks.filter(t => t.priority === priority);
                        const percentage = project._count?.tasks
                          ? Math.round((priorityTasks.length / project._count.tasks) * 100)
                          : 0;

                        const priorityColor =
                          priority === 'high'
                            ? '#ef4444'
                            : priority === 'medium'
                              ? '#f59e0b'
                              : '#10b981';

                        return (
                          <div key={priority} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                                <div
                                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: priorityColor }}
                                />
                                <span className="text-xs sm:text-sm capitalize">{priority}</span>
                              </div>
                              <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap ml-1">
                                {priorityTasks.length} tasks ({percentage}%)
                              </span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: priorityColor,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent
          className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6"
          style={{ zIndex: 100 }}
        >
          <DialogHeader className="mb-4">
            <DialogTitle>{editingTaskId ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          </DialogHeader>
          <TaskForm
            projectId={projectId}
            taskId={editingTaskId || undefined}
            onSuccess={handleTaskDialogClose}
            onCancel={handleTaskDialogClose}
          />
        </DialogContent>
      </Dialog>

      {/* Project Settings Dialog */}
      {project && (
        <ProjectSettingsDialog
          projectId={projectId}
          open={isSettingsDialogOpen}
          onOpenChange={setIsSettingsDialogOpen}
          project={project}
          statuses={statuses}
          onSuccess={async () => {
            // Fetch project data again
            try {
              const response = await fetch(`/api/projects/${projectId}`);
              if (response.ok) {
                const data = await response.json();
                setProject(data.project);
                setStatuses(data.project.statuses || []);
              }
            } catch (error) {
              console.error('Error refreshing project:', error);
            }
            await fetchTasks();
          }}
        />
      )}

      {/* Add Team Member Dialog */}
      <AddTeamMemberDialog
        open={isTeamDialogOpen}
        onOpenChange={setIsTeamDialogOpen}
        projectId={projectId}
        onSuccess={fetchUsers}
        existingTeamMemberIds={users.map(user => user.id)}
      />

      {/* Remove Team Member Confirmation Dialog */}
      <AlertDialog open={!!userToRemove} onOpenChange={open => !open && setUserToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              {userToRemove?.name || userToRemove?.email || 'this user'} from the project team? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingUser}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveTeamMember}
              disabled={isRemovingUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemovingUser ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
