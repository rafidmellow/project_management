'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserRole, useUserPermissions, useHasPermission } from '@/hooks/use-permission';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { DashboardSkeleton } from './dashboard-skeleton';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { DashboardStats } from '@/types/dashboard';
import { AdminDashboard } from './admin-dashboard';
import { ManagerDashboard } from './manager-dashboard';
import { UserDashboard } from './user-dashboard';

export function RoleDashboard() {
  const { data: session } = useSession();
  const { role: userRole, isLoading: roleLoading } = useUserRole();
  const { permissions, isLoading: permissionsLoading } = useUserPermissions();
  const { stats, isLoading: statsLoading, refetch } = useDashboardStats();

  // Ensure userPermissions is always an array
  const userPermissions = Array.isArray(permissions) ? permissions : [];

  // Ensure stats has the correct type
  const dashboardStats: DashboardStats = stats || {
    totalProjects: 0,
    recentProjects: [],
    projectGrowth: 0,
    systemStats: null,
  };

  // Check for specific permissions using our new hooks
  // These permissions determine which dashboard components to show
  const { hasPermission: hasSystemSettings, isLoading: systemSettingsLoading } =
    useHasPermission('system_settings');
  const { hasPermission: hasProjectManagement, isLoading: projectManagementLoading } =
    useHasPermission('project_management');
  const { hasPermission: hasUserManagement, isLoading: userManagementLoading } =
    useHasPermission('user_management');
  const { hasPermission: hasTeamView, isLoading: teamViewLoading } = useHasPermission('team_view');
  const { hasPermission: hasAttendanceManagement, isLoading: attendanceManagementLoading } =
    useHasPermission('attendance_management');

  // Determine which dashboard components to show based on user permissions
  const getDashboardView = () => {
    // Show loading skeleton while permissions or stats are being fetched
    if (
      roleLoading ||
      statsLoading ||
      permissionsLoading ||
      systemSettingsLoading ||
      projectManagementLoading ||
      userManagementLoading ||
      teamViewLoading ||
      attendanceManagementLoading
    ) {
      return <DashboardSkeleton />;
    }

    // Instead of showing a specific dashboard based on role,
    // we'll determine which components to show based on permissions

    // For backward compatibility, we'll still use the existing dashboard components
    // but in the future, we should make this more modular

    // If user has admin-level permissions, show admin dashboard
    if (hasSystemSettings || hasUserManagement) {
      return <AdminDashboard stats={dashboardStats} />;
    }
    // If user has manager-level permissions, show manager dashboard
    else if (hasProjectManagement || (hasTeamView && hasAttendanceManagement)) {
      return <ManagerDashboard stats={dashboardStats} />;
    }
    // Otherwise show user dashboard
    else {
      return <UserDashboard stats={dashboardStats} />;
    }

    // A more modular approach would be to render individual components based on permissions:
    // return (
    //   <>
    //     {hasSystemSettings && <SystemStatsComponent stats={dashboardStats.systemStats} />}
    //     {hasProjectManagement && <ProjectManagementComponent projects={dashboardStats.recentProjects} />}
    //     {hasUserManagement && <UserManagementComponent />}
    //     {hasTeamView && <TeamViewComponent />}
    //     {/* Always show personal tasks */}
    //     <PersonalTasksComponent />
    //   </>
    // )
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {session?.user?.name}</h2>
        <div className="flex flex-wrap gap-2">
          {roleLoading ? (
            <>
              <Skeleton className="h-6 w-20" />
            </>
          ) : (
            <Badge key={userRole} variant="outline" className="capitalize">
              {/* Use a generic icon for all roles */}
              <ShieldCheck className="mr-1 h-3 w-3" />
              {userRole}
            </Badge>
          )}
        </div>
      </div>

      {getDashboardView()}

      <Card>
        <CardHeader>
          <CardTitle>Your Permissions</CardTitle>
          <CardDescription>These are the actions you can perform in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {permissionsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {userPermissions.map(permission => (
                <Badge key={permission} variant="secondary" className="capitalize">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {permission.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
