'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTeamMembers, useRemoveTeamMember } from '@/hooks/use-team-management';
import { useToast } from '@/hooks/use-toast';
import { useHasPermission } from '@/hooks/use-has-permission';
import { useProjects } from '@/hooks/use-data';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Briefcase, ChevronDown, ChevronRight } from 'lucide-react';

// Import our extracted components
import { TeamMembersFilters } from './team-members-filters';
import { TeamMemberRow } from './team-member-row';
import { TeamMembersEmptyState } from './team-members-empty-state';
import { DeleteTeamMemberDialog } from './delete-team-member-dialog';

// Import our type definitions
import {
  DeleteConfirmation,
  TeamMembersFilters as FiltersType,
  TeamMemberWithProjects,
} from './team-types';

interface TeamMembersListProps {
  projectId?: string;
  limit?: number;
  showFilters?: boolean;
  groupByProject?: boolean;
}

/**
 * An optimized component for displaying and managing team members
 * Features:
 * - Filtering and sorting
 * - Deduplication of team members across projects
 * - Optional grouping by project
 * - Deletion confirmation
 * - Accessibility support
 */
export function TeamMembersList({
  projectId,
  limit = 50,
  showFilters = true,
  groupByProject = false,
}: TeamMembersListProps) {
  // State for pagination, filters, and deletion
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FiltersType>({
    search: '',
    projectId: projectId || null,
  });
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [teamMemberToDelete, setTeamMemberToDelete] = useState<DeleteConfirmation | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  // Hooks for data and permissions
  const { data: session } = useSession();
  const { toast } = useToast();
  const { hasPermission: canDeleteTeamMembers } = useHasPermission('team_remove');
  const { hasPermission: canCreateProject } = useHasPermission('project_create');
  const { hasPermission: canAddMembers } = useHasPermission('team_add');
  const { projects } = useProjects(1, 100);

  // Update filters if projectId prop changes
  useEffect(() => {
    if (projectId) {
      setFilters(prev => ({ ...prev, projectId }));
    }
  }, [projectId]);

  // Fetch team members with current filters
  const { teamMembers, isLoading, isError, mutate } = useTeamMembers(
    filters.projectId || undefined,
    page,
    limit,
    filters.search
  );

  // Hook for removing team members
  const { removeTeamMember, isRemoving } = useRemoveTeamMember();

  /**
   * Process team members to remove duplicates and add project information
   * This is an expensive operation, so we memoize it
   */
  const processedMembers = useMemo(() => {
    if (!teamMembers || teamMembers.length === 0) return [];

    // Create a map to track unique users
    const userMap = new Map<string, TeamMemberWithProjects>();

    // First pass: collect all projects for each user
    teamMembers.forEach(member => {
      if (!member.user?.id || !member.project) return;

      const userId = member.user.id;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          ...member,
          projects: [member.project],
        });
      } else {
        const existingUser = userMap.get(userId)!;
        if (!existingUser.projects.some(p => p?.id === member.project?.id)) {
          existingUser.projects.push(member.project);
        }
      }
    });

    // Convert map to array
    return Array.from(userMap.values());
  }, [teamMembers]);

  /**
   * Group team members by project
   */
  const groupedMembers = useMemo(() => {
    if (!teamMembers || teamMembers.length === 0 || !groupByProject) return {};

    // Group by project
    const projectGroups: Record<string, TeamMemberWithProjects[]> = {};

    processedMembers.forEach(member => {
      member.projects.forEach(project => {
        if (!project?.id) return;

        const projectId = project.id;
        if (!projectGroups[projectId]) {
          projectGroups[projectId] = [];
        }

        // Check if this user is already in this project group
        const existingMember = projectGroups[projectId].find(m => m.user?.id === member.user?.id);
        if (!existingMember) {
          projectGroups[projectId].push(member);
        }
      });
    });

    return projectGroups;
  }, [processedMembers, groupByProject, teamMembers]);

  // Initialize expanded state for projects
  useEffect(() => {
    if (groupByProject) {
      const initialExpandedState: Record<string, boolean> = {};
      Object.keys(groupedMembers).forEach(projectId => {
        initialExpandedState[projectId] = true;
      });
      setExpandedProjects(initialExpandedState);
    }
  }, [groupedMembers, groupByProject]);

  /**
   * Handle filter changes
   */
  const handleFiltersChange = useCallback((newFilters: FiltersType) => {
    setFilters(newFilters);
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      projectId: projectId || null, // Keep the projectId if it was provided as a prop
    });
  }, [projectId]);

  /**
   * Toggle project expanded state
   */
  const toggleProjectExpanded = useCallback((projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  }, []);

  /**
   * Prepare for team member deletion
   */
  const confirmDelete = useCallback(
    (member: TeamMemberWithProjects) => {
      if (!canDeleteTeamMembers) {
        toast({
          title: 'Permission Denied',
          description: "You don't have permission to remove team members.",
          variant: 'destructive',
        });
        return;
      }

      setTeamMemberToDelete({
        id: member.id,
        name: member.user?.name || null,
        email: member.user?.email || '',
      });
      setConfirmDeleteDialogOpen(true);
    },
    [canDeleteTeamMembers, toast]
  );

  /**
   * Handle team member deletion
   */
  const handleDelete = useCallback(async () => {
    if (!teamMemberToDelete) return;

    try {
      await removeTeamMember(teamMemberToDelete.id);

      toast({
        title: 'Team member removed',
        description: 'The team member has been removed successfully.',
      });

      // Close dialog and reset state
      setConfirmDeleteDialogOpen(false);
      setTeamMemberToDelete(null);

      // Refresh the team members list
      mutate();
    } catch (error) {
      console.error('Error removing team member:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove team member',
        variant: 'destructive',
      });
    }
  }, [teamMemberToDelete, removeTeamMember, toast, mutate]);

  /**
   * Close the delete confirmation dialog
   */
  const closeDeleteDialog = useCallback(() => {
    setConfirmDeleteDialogOpen(false);
    setTeamMemberToDelete(null);
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12" aria-live="polite" aria-busy="true">
        <Spinner size="lg" className="text-primary/50" />
        <span className="sr-only">Loading team members...</span>
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div
        className="flex justify-center items-center py-12 text-muted-foreground"
        role="alert"
        aria-live="assertive"
      >
        Error loading team members. Please try again.
      </div>
    );
  }

  // Render empty state
  if (teamMembers.length === 0) {
    return (
      <TeamMembersEmptyState
        hasFilters={!!filters.search || !!filters.projectId}
        onClearFilters={clearFilters}
      />
    );
  }

  // Render team members list grouped by project
  if (groupByProject) {
    return (
      <div className="space-y-6">
        {/* Filters */}
        {showFilters && (
          <TeamMembersFilters
            filters={filters}
            projects={projects}
            onFiltersChange={handleFiltersChange}
          />
        )}

        {/* Team Members List Grouped by Project */}
        <div className="space-y-4">
          {Object.keys(groupedMembers).length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  No team members match your current filters.
                </div>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedMembers).map(([projectId, members]) => (
              <Card key={projectId} className="overflow-hidden">
                <Collapsible
                  open={expandedProjects[projectId]}
                  onOpenChange={() => toggleProjectExpanded(projectId)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="p-4 cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-lg">
                            {members[0]?.projects.find(p => p.id === projectId)?.title ||
                              'Unknown Project'}
                          </CardTitle>
                          <Badge variant="outline" className="ml-2">
                            {members.length} {members.length === 1 ? 'member' : 'members'}
                          </Badge>
                        </div>
                        {expandedProjects[projectId] ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-medium">Name</TableHead>
                            <TableHead className="font-medium">Role</TableHead>
                            <TableHead className="font-medium">Projects</TableHead>
                            <TableHead className="text-right font-medium w-[100px]">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members.map(member => (
                            <TeamMemberRow
                              key={`${projectId}-${member.user?.id}`}
                              member={member}
                              currentUserId={session?.user?.id}
                              canDeleteTeamMembers={canDeleteTeamMembers}
                              onDeleteClick={confirmDelete}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <DeleteTeamMemberDialog
          isOpen={confirmDeleteDialogOpen}
          isDeleting={isRemoving}
          teamMemberToDelete={teamMemberToDelete}
          onClose={closeDeleteDialog}
          onConfirm={handleDelete}
        />
      </div>
    );
  }

  // Render flat team members list
  return (
    <div>
      {/* Filters */}
      {showFilters && (
        <TeamMembersFilters
          filters={filters}
          projects={projects}
          onFiltersChange={handleFiltersChange}
        />
      )}

      {/* Team Members Table */}
      <div
        className="rounded-md border border-border overflow-hidden bg-background"
        role="region"
        aria-label="Team members list"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
              <TableHead className="font-semibold text-foreground py-3">Name</TableHead>
              <TableHead className="font-semibold text-foreground py-3">Role</TableHead>
              <TableHead className="font-semibold text-foreground py-3">Projects</TableHead>
              <TableHead className="text-right font-semibold text-foreground w-[100px] py-3">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedMembers.map(member => (
              <TeamMemberRow
                key={member.user?.id}
                member={member}
                currentUserId={session?.user?.id}
                canDeleteTeamMembers={canDeleteTeamMembers}
                onDeleteClick={confirmDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteTeamMemberDialog
        isOpen={confirmDeleteDialogOpen}
        isDeleting={isRemoving}
        teamMemberToDelete={teamMemberToDelete}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// Export the component with its original name for backward compatibility
export const ElegantTeamMembersList = TeamMembersList;
