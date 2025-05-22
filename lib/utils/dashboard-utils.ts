import { ProjectSummary, ProjectStatusDistribution } from '@/types/dashboard';

/**
 * Calculate total tasks and completed tasks from projects
 */
export function calculateTaskStats(projects: ProjectSummary[]) {
  const totalTasks = projects.reduce((sum, project) => sum + (project.taskCount || 0), 0);
  const completedTasks = projects.reduce(
    (sum, project) => sum + (project.completedTaskCount || 0),
    0
  );
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    completionRate,
  };
}

/**
 * Calculate unique team members across projects
 */
export function calculateTeamMembers(projects: ProjectSummary[]) {
  const teamMembersSet = new Set();
  projects.forEach(project => {
    project.team?.forEach(member => {
      if (member?.id) teamMembersSet.add(member.id);
    });
  });

  return {
    teamMembersCount: teamMembersSet.size,
    uniqueMembers: Array.from(teamMembersSet),
  };
}

/**
 * Calculate project status distribution
 */
export function calculateProjectStatusDistribution(
  projects: ProjectSummary[]
): ProjectStatusDistribution {
  return {
    notStarted: projects.filter(p => p.progress === 0).length,
    inProgress: projects.filter(p => p.progress > 0 && p.progress < 100).length,
    completed: projects.filter(p => p.progress === 100).length,
  };
}

// The extractTasksFromProjects function has been removed
// Real task data is now fetched from the API using the useUserTasks hook
