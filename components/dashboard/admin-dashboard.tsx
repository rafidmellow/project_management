'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart3, CheckCircle2, FileText, Layers, Users } from 'lucide-react';
import { DashboardStats, ProjectSummary, SystemStats } from '@/types/dashboard';
import { calculateProjectStatusDistribution } from '@/utils/dashboard-utils';
import { StatsCard } from './stats-card';

interface AdminDashboardProps {
  stats: DashboardStats;
}

export function AdminDashboard({ stats }: AdminDashboardProps) {
  // Get system-wide stats (admin only)
  const systemStats: SystemStats = stats?.systemStats || {
    totalUsers: 0,
    usersByRole: { admin: 0, manager: 0, user: 0 },
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
  };

  // Get derived stats directly from the API response
  const totalProjects = stats?.totalProjects || 0;
  const recentProjects = stats?.recentProjects || [];
  const projectGrowth = stats?.projectGrowth || 0;

  // Calculate project status distribution
  const projectStatusDistribution = calculateProjectStatusDistribution(recentProjects);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          {/* Organization-wide metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Projects"
              value={totalProjects}
              description={
                projectGrowth > 0
                  ? `+${projectGrowth}% growth`
                  : projectGrowth < 0
                    ? `${projectGrowth}% decline`
                    : 'No change'
              }
              icon={<Layers className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Total Tasks"
              value={systemStats.totalTasks}
              description={`${systemStats.completedTasks} completed`}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Total Users"
              value={systemStats.totalUsers}
              description={`${systemStats.usersByRole.manager} managers, ${systemStats.usersByRole.user} users`}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="System Completion Rate"
              value={`${systemStats.completionRate}%`}
              description="Tasks completed across all projects"
              icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Most recently updated projects</CardDescription>
              </CardHeader>
              <CardContent>
                {recentProjects.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No recent projects found
                  </div>
                ) : (
                  <div className="space-y-4 text-sm">
                    {recentProjects.slice(0, 3).map(project => (
                      <div key={project.id} className="border-l-2 border-primary pl-3">
                        <p className="font-medium">{project.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {project.taskCount} tasks ({project.progress}% complete)
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {project.team?.slice(0, 3).map(member => (
                            <div
                              key={member.id}
                              className="w-5 h-5 rounded-full bg-muted overflow-hidden"
                            >
                              {member.image ? (
                                <img
                                  src={member.image}
                                  alt={member.name || 'Team member'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] bg-primary text-primary-foreground">
                                  {member.name?.charAt(0) || '?'}
                                </div>
                              )}
                            </div>
                          ))}
                          {project.team?.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{project.team.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Distribution</CardTitle>
                <CardDescription>Project completion status</CardDescription>
              </CardHeader>
              <CardContent>
                {recentProjects.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No project data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {recentProjects.slice(0, 5).map(project => (
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
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Users by role in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Administrators</span>
                        <span className="font-medium">{systemStats.usersByRole.admin}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${systemStats.totalUsers ? (systemStats.usersByRole.admin / systemStats.totalUsers) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Managers</span>
                        <span className="font-medium">{systemStats.usersByRole.manager}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{
                            width: `${systemStats.totalUsers ? (systemStats.usersByRole.manager / systemStats.totalUsers) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Regular Users</span>
                        <span className="font-medium">{systemStats.usersByRole.user}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{
                            width: `${systemStats.totalUsers ? (systemStats.usersByRole.user / systemStats.totalUsers) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Status</CardTitle>
                <CardDescription>Distribution of project statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Not Started</span>
                        <span className="font-medium">{projectStatusDistribution.notStarted}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-500"
                          style={{
                            width: `${recentProjects.length ? (projectStatusDistribution.notStarted / recentProjects.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>In Progress</span>
                        <span className="font-medium">{projectStatusDistribution.inProgress}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${recentProjects.length ? (projectStatusDistribution.inProgress / recentProjects.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Completed</span>
                        <span className="font-medium">{projectStatusDistribution.completed}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{
                            width: `${recentProjects.length ? (projectStatusDistribution.completed / recentProjects.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
              <CardDescription>Overall system metrics and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Task Completion</h3>
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-4 mr-2 overflow-hidden">
                        <div
                          className="bg-green-500 h-4"
                          style={{ width: `${systemStats.completionRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{systemStats.completionRate}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {systemStats.completedTasks} of {systemStats.totalTasks} tasks completed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Project Growth</h3>
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-4 mr-2 overflow-hidden">
                        <div
                          className={`h-4 ${projectGrowth >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(Math.abs(projectGrowth), 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {projectGrowth >= 0 ? '+' : ''}
                        {projectGrowth}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Project growth rate compared to last month
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          {/* Coming Soon Banner */}
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-500"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div>
              <p className="font-medium text-amber-800">Coming Soon</p>
              <p className="text-sm text-amber-700">
                The reporting functionality is currently under development and will be available in
                a future update.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>System Reports</CardTitle>
                <CardDescription>Generate and view system reports</CardDescription>
              </div>
              <Button variant="outline" size="sm" disabled title="This feature is coming soon">
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md">
                  <div className="flex items-center p-4 border-b">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">User Activity Report</p>
                      <p className="text-xs text-muted-foreground">
                        Summary of user logins and activities
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" disabled title="This feature is coming soon">
                      View
                    </Button>
                  </div>
                  <div className="flex items-center p-4 border-b">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">Project Completion Report</p>
                      <p className="text-xs text-muted-foreground">
                        Analysis of project completion rates
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" disabled title="This feature is coming soon">
                      View
                    </Button>
                  </div>
                  <div className="flex items-center p-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">Attendance Summary</p>
                      <p className="text-xs text-muted-foreground">
                        Overview of attendance patterns
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" disabled title="This feature is coming soon">
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
