'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CheckCircle2, FileText, Layers, Users } from 'lucide-react';
import { DashboardStats } from '@/types/dashboard';
import {
  calculateTaskStats,
  calculateTeamMembers,
  calculateProjectStatusDistribution,
} from '@/utils/dashboard-utils';
import { StatsCard } from './stats-card';

interface ManagerDashboardProps {
  stats: DashboardStats;
}

export function ManagerDashboard({ stats }: ManagerDashboardProps) {
  // Get derived stats directly from the API response
  const totalProjects = stats?.totalProjects || 0;
  const recentProjects = stats?.recentProjects || [];
  const projectGrowth = stats?.projectGrowth || 0;

  // Use utility functions for calculations
  const { totalTasks, completedTasks, pendingTasks, completionRate } =
    calculateTaskStats(recentProjects);
  const { teamMembersCount } = calculateTeamMembers(recentProjects);

  // Calculate project status distribution
  const projectStatusDistribution = calculateProjectStatusDistribution(recentProjects);

  // Group projects by status for display
  const projectsByStatus = {
    notStarted: recentProjects.filter(p => p.progress === 0),
    inProgress: recentProjects.filter(p => p.progress > 0 && p.progress < 100),
    completed: recentProjects.filter(p => p.progress === 100),
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Your Projects"
              value={totalProjects}
              description="Projects you're involved with"
              icon={<Layers className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Pending Tasks"
              value={pendingTasks}
              description={`${completedTasks} completed`}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Team Members"
              value={teamMembersCount}
              description="In your projects"
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
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
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>Task completion and project metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {recentProjects.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No project data available
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Task Completion Rate</span>
                      <span className="font-medium">{completionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Projects in Progress</span>
                      <span className="font-medium">{projectsByStatus.inProgress.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed Projects</span>
                      <span className="font-medium">{projectsByStatus.completed.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Project Progress</span>
                      <span className="font-medium">
                        {recentProjects.length > 0
                          ? Math.round(
                              recentProjects.reduce((sum, p) => sum + p.progress, 0) /
                                recentProjects.length
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Your most recently updated projects</CardDescription>
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
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>Manage your team members and their assignments</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Add Team Member
              </Button>
            </CardHeader>
            <CardContent>
              {teamMembersCount === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Team Members</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You don't have any team members in your projects yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-md">
                    {recentProjects.slice(0, 3).map(project => (
                      <div key={project.id} className="border-b last:border-0">
                        <div className="p-4">
                          <h3 className="font-medium">{project.title}</h3>
                          <div className="mt-2 space-y-2">
                            {project.team?.slice(0, 3).map(member => (
                              <div key={member.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                                    {member.image ? (
                                      <img
                                        src={member.image}
                                        alt={member.name || 'Team member'}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xs bg-primary text-primary-foreground">
                                        {member.name?.charAt(0) || '?'}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{member.name}</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm">
                                  Manage
                                </Button>
                              </div>
                            ))}
                            {project.team?.length > 3 && (
                              <div className="text-center text-sm text-muted-foreground pt-2">
                                +{project.team.length - 3} more team members
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Management</CardTitle>
                <CardDescription>Manage your projects and their progress</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Layers className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </CardHeader>
            <CardContent>
              {recentProjects.length === 0 ? (
                <div className="text-center py-12">
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Projects</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You don't have any projects yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-md divide-y">
                    {recentProjects.map(project => (
                      <div key={project.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{project.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {project.taskCount} tasks • {project.teamCount} team members
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-muted">
                              {project.progress}% complete
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
