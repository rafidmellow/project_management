'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useHasPermission } from '@/hooks/use-has-permission';
import { useProjects } from '@/hooks/use-data';

import { TeamMembersList } from '@/components/team/team-members-list';
import { Spinner } from '@/components/ui/spinner';

/**
 * Team Members Page
 *
 * Displays a list of team members across all projects with filtering and sorting capabilities.
 * Provides actions for adding team members and creating projects based on user permissions.
 */
export default function TeamMembersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission: canAddMembers } = useHasPermission('team_add');
  const { hasPermission: canCreateProject } = useHasPermission('project_create');
  const { projects, isLoading: isLoadingProjects } = useProjects(1, 100);
  const hasProjects = projects && projects.length > 0;

  // Show loading state when checking auth
  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-4" aria-live="polite" aria-busy="true">
        <h1 className="text-3xl font-bold">Team Members</h1>
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <main>
      <div className="flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Team Members</h1>
        </header>

        {/* Team Members List */}
        <section aria-labelledby="team-members-heading">
          <h2 id="team-members-heading" className="sr-only">
            Team Members List
          </h2>
          <TeamMembersList limit={50} />
        </section>
      </div>
    </main>
  );
}
