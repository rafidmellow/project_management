'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  action: string;
  entityType: string;
  description: string | null;
  createdAt: string;
  project: {
    id: string;
    title: string;
  } | null;
  task: {
    id: string;
    title: string;
  } | null;
}

interface UserProfileActivityProps {
  activities: Activity[];
}

export function UserProfileActivity({ activities }: UserProfileActivityProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>User's recent actions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
            <div className="text-center">
              <h3 className="text-lg font-medium">No Activity</h3>
              <p className="text-sm text-muted-foreground">This user has no recent activity.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>User's recent actions and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {activities.map(activity => (
            <div key={activity.id} className="flex">
              <div className="relative mr-4 flex h-full w-10 items-center justify-center">
                <div className="absolute h-full w-px bg-border" />
                <div className="relative z-10 h-3 w-3 rounded-full bg-primary ring-2 ring-background" />
              </div>
              <div className="flex-1 pt-0.5">
                <div className="text-sm font-medium">{getActivityTitle(activity)}</div>
                {activity.description && (
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getActivityTitle(activity: Activity): React.ReactNode {
  const { action, entityType, project, task } = activity;

  const actionText = getActionText(action);
  const entityTypeText = getEntityTypeText(entityType);

  if (entityType === 'project' && project) {
    return (
      <>
        {actionText} project{' '}
        <Link href={`/projects/${project.id}`} className="font-medium text-primary hover:underline">
          {project.title}
        </Link>
      </>
    );
  }

  if (entityType === 'task' && task) {
    return (
      <>
        {actionText} task{' '}
        <Link href={`/tasks/${task.id}`} className="font-medium text-primary hover:underline">
          {task.title}
        </Link>
        {project && (
          <>
            {' '}
            in project{' '}
            <Link
              href={`/projects/${project.id}`}
              className="font-medium text-primary hover:underline"
            >
              {project.title}
            </Link>
          </>
        )}
      </>
    );
  }

  return `${actionText} ${entityTypeText}`;
}

function getActionText(action: string): string {
  switch (action) {
    case 'created':
      return 'Created';
    case 'updated':
      return 'Updated';
    case 'deleted':
      return 'Deleted';
    case 'completed':
      return 'Completed';
    case 'assigned':
      return 'Was assigned to';
    default:
      return action.charAt(0).toUpperCase() + action.slice(1);
  }
}

function getEntityTypeText(entityType: string): string {
  switch (entityType) {
    case 'project':
      return 'a project';
    case 'task':
      return 'a task';
    case 'profile':
      return 'their profile';
    default:
      return entityType;
  }
}
