'use client';

import { User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserCard } from '@/components/team/user-card';
import { UserSummary } from '@/types/user';
import { useBreakpoints } from '@/hooks/use-breakpoints';
import { cn } from '@/lib/utils';

interface UserGridProps {
  users: UserSummary[];
  onDelete: (userId: string) => void;
}

export function UserGrid({ users, onDelete }: UserGridProps) {
  // Get breakpoint information
  const { is2xl } = useBreakpoints();

  if (users.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <UserIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No Users Found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            No users match your current search criteria or filters. Try adjusting your search terms
            or filter settings.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid gap-5 sm:grid-cols-2 lg:grid-cols-3',
        is2xl ? 'xl:grid-cols-4 2xl:grid-cols-5' : 'xl:grid-cols-3 2xl:grid-cols-4'
      )}
    >
      {is2xl && (
        <div className="hidden 2xl:block col-span-full mb-2">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary"></span>
            <span>Large screen optimized grid layout</span>
          </div>
        </div>
      )}
      {users.map(user => (
        <UserCard key={user.id} user={user} onDelete={onDelete} />
      ))}
    </div>
  );
}
