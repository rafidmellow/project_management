'use client';

import Link from 'next/link';
import { Calendar, Clock, MoreHorizontal, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Project {
  id: string;
  title: string;
  status: {
    id: string;
    name: string;
    color: string;
    description?: string | null;
    isDefault?: boolean;
  };
  startDate: string | null;
  endDate: string | null;
  role: string;
  joinedAt: string;
}

interface UserProfileProjectsProps {
  projects: Project[];
}

export function UserProfileProjects({ projects }: UserProfileProjectsProps) {
  if (!projects || projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Projects the user is involved in</CardDescription>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/app/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
            <div className="text-center">
              <h3 className="text-lg font-medium">No Projects</h3>
              <p className="text-sm text-muted-foreground">
                This user is not currently assigned to any projects.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Projects the user is involved in</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/app/projects">View All</Link>
            </Button>
            <Button size="sm" variant="default" asChild>
              <Link href="/app/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map(project => (
            <Card key={project.id} className="h-full overflow-hidden border bg-background">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge
                    style={{ backgroundColor: project.status?.color || '#6E56CF' }}
                    className="text-white capitalize"
                  >
                    {project.status?.name || 'Unknown'}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Link href={`/app/projects/${project.id}`} className="w-full">
                          View Project
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Link href={`/app/projects/${project.id}/edit`} className="w-full">
                          Edit Project
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="mt-2 text-xl">
                  <Link href={`/app/projects/${project.id}`} className="hover:text-primary">
                    {project.title}
                  </Link>
                </CardTitle>
                <Badge variant="outline" className="mt-1 capitalize">
                  {project.role}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {(project.startDate || project.endDate) && (
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>
                        {project.startDate ? formatDate(project.startDate) : 'Not started'}
                        {' - '}
                        {project.endDate ? formatDate(project.endDate) : 'Ongoing'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>
                      Joined {project.joinedAt ? formatDate(project.joinedAt) : 'Recently'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
