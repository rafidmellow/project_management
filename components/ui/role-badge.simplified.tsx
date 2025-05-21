'use client';

import { Badge, BadgeProps } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleBadgeProps extends Omit<BadgeProps, 'children'> {
  role?: string;
  showIcon?: boolean;
  showTooltip?: boolean;
  type?: string; // Added type property for compatibility
}

export function RoleBadge({
  role = 'user',
  showIcon = true,
  showTooltip = false,
  type,
  className,
  ...props
}: RoleBadgeProps) {
  // Normalize role to lowercase for consistent handling
  const normalizedRole = role?.toLowerCase() || 'user';

  // Define role colors and descriptions
  const roleConfig: Record<string, { color: string; description: string }> = {
    admin: {
      color: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
      description: 'Full access to all system features and settings',
    },
    manager: {
      color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
      description: 'Can manage projects, tasks, and team members',
    },
    user: {
      color: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
      description: 'Standard user with basic access',
    },
    guest: {
      color: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      description: 'Limited access to view-only features',
    },
  };

  // Get role configuration or use default
  const config = roleConfig[normalizedRole] || roleConfig.user;

  const badge = (
    <Badge
      variant="outline"
      className={cn('font-medium border', config.color, className)}
      {...props}
    >
      {showIcon && <Shield className="mr-1 h-3 w-3" />}
      {role || 'User'}
    </Badge>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p>{config.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
