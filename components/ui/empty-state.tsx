'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

/**
 * EmptyState component for displaying when there is no data
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<Users className="h-12 w-12" />}
 *   title="No team members found"
 *   description="Team members are associated with projects. Create a project first to add team members."
 *   actions={
 *     <Button asChild>
 *       <Link href="/projects/new">Create Project</Link>
 *     </Button>
 *   }
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  actions,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        'flex flex-col items-center justify-center text-center border-dashed border-2 bg-muted/5',
        compact ? 'p-6' : 'p-8 sm:p-12',
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-muted/20 text-muted-foreground',
            compact ? 'mb-4 size-16' : 'mb-6 size-20'
          )}
        >
          {icon}
        </div>
      )}
      <h3
        className={cn('font-semibold text-foreground', compact ? 'text-lg mb-1' : 'text-xl mb-2')}
      >
        {title}
      </h3>
      <p
        className={cn('text-muted-foreground max-w-md mx-auto', compact ? 'text-sm mb-4' : 'mb-6')}
      >
        {description}
      </p>
      {actions && <div className="flex flex-wrap gap-3 justify-center">{actions}</div>}
    </Card>
  );
}
