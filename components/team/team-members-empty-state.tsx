'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserPlus, Users } from 'lucide-react';

interface TeamMembersEmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

/**
 * A memoized component for displaying an empty state when no team members are found
 */
export const TeamMembersEmptyState = memo(function TeamMembersEmptyState({
  hasFilters,
  onClearFilters,
}: TeamMembersEmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="bg-muted/30 rounded-full p-4 mb-4">
        <Users className="h-8 w-8 text-muted-foreground/70" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-medium mb-2">No team members found</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        {hasFilters
          ? 'No team members match your current filters.'
          : 'No team members found. Team members are associated with projects.'}
      </p>
      <div className="flex gap-3">
        {hasFilters ? (
          <Button variant="outline" onClick={onClearFilters}>
            Clear Filters
          </Button>
        ) : (
          <Button asChild variant="default">
            <Link href="/team/users">
              <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
              Manage Users
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
});
