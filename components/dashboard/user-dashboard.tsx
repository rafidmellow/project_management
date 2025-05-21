'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, FileText, Layers, Clock } from 'lucide-react';
import { DashboardStats } from '@/types/dashboard';
import { calculateTaskStats } from '@/utils/dashboard-utils';
import { useUserTasks } from '@/hooks/use-user-tasks';
import Link from 'next/link';

import { StatsCard } from './stats-card';

interface UserDashboardProps {
  stats: DashboardStats;
}

export function UserDashboard({ stats }: UserDashboardProps) {
  // Get derived stats directly from the API response
  const totalProjects = stats?.totalProjects || 0;
  const recentProjects = stats?.recentProjects || [];
  const projectGrowth = stats?.projectGrowth || 0;

  // Use utility functions for calculations
  const { totalTasks, completedTasks, pendingTasks, completionRate } =
    calculateTaskStats(recentProjects);

  // Fetch real task data from the API
  const { tasks: myTasks, upcomingTasks, isLoading: tasksLoading } = useUserTasks();

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">My Tasks</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Link href="/attendance/dashboard">
              <Button variant="outline" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Go to Attendance</span>
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatsCard
              title="My Projects"
              value={totalProjects}
              description="Projects you're part of"
              icon={<Layers className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="My Tasks"
              value={totalTasks}
              description={`${completedTasks} completed, ${pendingTasks} pending`}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Completion Rate"
              value={`${completionRate}%`}
              description="Tasks completed"
              icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
                <CardDescription>Your current project status</CardDescription>
              </CardHeader>
              <CardContent>
                {recentProjects.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No project data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {recentProjects.slice(0, 4).map(project => (
                        <div key={project.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="truncate max-w-[180px]">{project.title}</span>
                            <span className="font-medium">{project.progress}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
                <CardDescription>Your pending tasks with nearest deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ) : upcomingTasks.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No upcoming tasks</div>
                ) : (
                  <div className="space-y-4">
                    {upcomingTasks.map(task => (
                      <div key={task.id} className="flex items-start space-x-2">
                        <div
                          className={`mt-0.5 h-4 w-4 rounded-full ${
                            task.priority === 'high'
                              ? 'bg-red-500'
                              : task.priority === 'medium'
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                          }`}
                        />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <span>{task.projectTitle}</span>
                            <span className="mx-1">•</span>
                            <span>
                              Due{' '}
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString()
                                : 'No due date'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Tasks</CardTitle>
                <CardDescription>View and manage your assigned tasks</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Filter
                </Button>
                <Button variant="default" size="sm">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark Complete
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : myTasks.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Tasks</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You don't have any tasks assigned to you
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="rounded-md border">
                    <div className="bg-muted px-4 py-2 flex items-center text-sm font-medium">
                      <div className="w-6"></div>
                      <div className="flex-1 ml-2">Task</div>
                      <div className="w-28 text-right">Project</div>
                      <div className="w-28 text-right">Due Date</div>
                      <div className="w-20 text-right">Priority</div>
                    </div>
                    <div className="divide-y">
                      {myTasks.slice(0, 10).map(task => (
                        <div
                          key={task.id}
                          className={`px-4 py-3 flex items-center text-sm ${task.completed ? 'bg-muted/50' : ''}`}
                        >
                          <div className="w-6">
                            <div className="h-4 w-4 rounded border border-primary flex items-center justify-center">
                              {task.completed && <CheckCircle2 className="h-3 w-3 text-primary" />}
                            </div>
                          </div>
                          <div className="flex-1 ml-2">
                            <span
                              className={task.completed ? 'line-through text-muted-foreground' : ''}
                            >
                              {task.title}
                            </span>
                          </div>
                          <div className="w-28 text-right text-muted-foreground truncate">
                            {task.projectTitle}
                          </div>
                          <div className="w-28 text-right">
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString()
                              : 'No due date'}
                          </div>
                          <div className="w-20 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                                task.priority === 'high'
                                  ? 'bg-red-100 text-red-800'
                                  : task.priority === 'medium'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {myTasks.length > 10 && (
                    <div className="text-center pt-2">
                      <Button variant="link" size="sm">
                        View all {myTasks.length} tasks
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
