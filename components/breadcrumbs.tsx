'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useProject, useTask } from '@/hooks/use-data';
import { useUserProfile } from '@/hooks/use-user-profile';

// Define route mappings for breadcrumb labels
const routeMappings: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  tasks: 'Tasks',
  team: 'Team',
  profile: 'Profile',
  settings: 'Settings',
  kanban: 'Kanban Board',
  new: 'New',
  edit: 'Edit',
  attendance: 'Attendance',
  history: 'History',
  reports: 'Reports',
  statistics: 'Statistics',
};

interface BreadcrumbItem {
  href: string;
  label: string;
  isLastSegment: boolean;
  isDynamic?: boolean;
  id?: string;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // Extract user ID from profile path if present
  // Check both /profile/[userId] and /users/[userId] paths
  const userIdMatch = pathname.match(/\/(profile|users)\/([a-zA-Z0-9_-]+)/);
  const userId = userIdMatch ? userIdMatch[2] : null;

  // Check if we're on a user profile page
  const isUserProfilePage =
    userIdMatch && (userIdMatch[1] === 'profile' || userIdMatch[1] === 'users');

  // Extract project ID from project path if present
  const projectIdMatch = pathname.match(/\/projects\/([a-zA-Z0-9_-]+)/);
  const projectId = projectIdMatch ? projectIdMatch[1] : null;

  // Extract task ID from task path if present
  const taskIdMatch = pathname.match(/\/tasks\/([a-zA-Z0-9_-]+)/);
  const taskId = taskIdMatch ? taskIdMatch[1] : null;

  // Don't try to fetch if it's a "new" route
  const isNewTaskRoute = taskId === 'new';
  const isNewProjectRoute = projectId === 'new';

  // Fetch user profile if we're on a profile page
  const { profile, isLoading: isProfileLoading } = useUserProfile(
    isUserProfilePage ? userId || '' : ''
  );

  // Fetch project if we're on a project page (but not for "new" project)
  const { project, isLoading: isProjectLoading } = useProject(isNewProjectRoute ? null : projectId);

  // State to store project title from direct API call if needed
  const [directProjectTitle, setDirectProjectTitle] = useState<string | null>(null);

  // Fetch project data directly if not available through the hook
  useEffect(() => {
    if (projectId && !isNewProjectRoute && !project && !isProjectLoading) {
      fetch(`/api/projects/${projectId}`)
        .then(res => res.json())
        .then(data => {
          if (data.project && data.project.title) {
            setDirectProjectTitle(data.project.title);
          }
        })
        .catch(err => {
          console.error('Error fetching project directly:', err);
        });
    }
  }, [projectId, project, isProjectLoading, isNewProjectRoute]);

  // Fetch task if we're on a task page (but not for "new" task)
  const { task, isLoading: isTaskLoading } = useTask(isNewTaskRoute ? null : taskId);

  // Memoize breadcrumb generation to avoid unnecessary re-renders
  useEffect(() => {
    // Skip breadcrumb generation for dashboard page
    if (pathname === '/dashboard') {
      setBreadcrumbs([]);
      return;
    }

    // Generate breadcrumbs only when pathname changes
    const generateBreadcrumbs = () => {
      const segments = pathname.split('/').filter(Boolean);

      if (segments.length === 0) {
        setBreadcrumbs([]);
        return;
      }

      const breadcrumbItems: BreadcrumbItem[] = [];
      let currentPath = '';

      segments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const isLastSegment = index === segments.length - 1;

        // Check if segment is a UUID, ID, or special value like 'new'
        const isDynamic =
          /^[a-f0-9]{8,}$/i.test(segment) || segment === '[id]' || segment === 'new';

        // Get a more readable label
        let label = routeMappings[segment] || segment;

        // For dynamic segments, try to get a better label
        if (isDynamic) {
          // If it's a project ID or 'new' in the projects route
          if (segments.includes('projects') && segments.indexOf('projects') < index) {
            if (segment === 'new') {
              label = 'New Project';
            } else if (isProjectLoading) {
              label = 'Loading...';
            } else if (project && project.title) {
              // Use the project title directly
              label = project.title;
            } else if (directProjectTitle) {
              // Use the directly fetched project title
              label = directProjectTitle;
            } else {
              label = 'Project Details';
            }
          }
          // If it's a task ID or 'new' in the tasks route
          else if (segments.includes('tasks') && segments.indexOf('tasks') < index) {
            if (segment === 'new') {
              label = 'New Task';
            } else if (isTaskLoading) {
              label = 'Loading...';
            } else if (task && task.title) {
              label = task.title;
            } else {
              label = 'Task Details';
            }
          }
          // If it's a user profile and we have the profile data
          else if (
            (segments.includes('profile') && segments.indexOf('profile') < index) ||
            (segments.includes('users') && segments.indexOf('users') < index)
          ) {
            if (isProfileLoading) {
              label = 'Loading...';
            } else if (profile && profile.name) {
              label = profile.name;
            } else {
              label = 'User Profile';
            }
          } else {
            label = 'Details';
          }
        }

        breadcrumbItems.push({
          href: currentPath,
          label: label,
          isLastSegment,
          isDynamic,
        });
      });

      setBreadcrumbs(breadcrumbItems);
    };

    generateBreadcrumbs();
  }, [pathname, profile, isProfileLoading, project, isProjectLoading, task, isTaskLoading]);

  // Don't render anything if we're on the dashboard or have no breadcrumbs
  if (pathname === '/dashboard' || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard" className="flex items-center">
              <Home className="h-3.5 w-3.5 mr-1" />
              <span>Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbs.map((item, index) => (
          <React.Fragment key={item.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {item.isLastSegment ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
