'use client';

import { ShieldCheck, ShieldAlert, User, Shield } from 'lucide-react';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SYSTEM_ROLES, getRoleDisplayName, SystemRole } from '@/lib/roles';

interface RoleBadgeProps extends Omit<BadgeProps, 'children'> {
  role?: string;
  showIcon?: boolean;
  showTooltip?: boolean;
  type?: string; // Added type property for compatibility
}

export function RoleBadge({
  role = 'user',
  showIcon = true,
  showTooltip = true,
  className,
  ...props
}: RoleBadgeProps) {
  // Get the appropriate icon and style based on role
  const getIconAndVariant = () => {
    // Handle undefined role
    const safeRole = role?.toLowerCase() || 'user';

    switch (safeRole) {
      case 'admin':
        return {
          icon: <ShieldAlert className="mr-1 h-3 w-3" />,
          variant: 'destructive' as const,
          tooltip: SYSTEM_ROLES.admin.description,
        };
      case 'manager':
        return {
          icon: <ShieldCheck className="mr-1 h-3 w-3" />,
          variant: 'default' as const,
          tooltip: SYSTEM_ROLES.manager.description,
        };
      case 'guest':
        return {
          icon: <Shield className="mr-1 h-3 w-3" />,
          variant: 'secondary' as const,
          tooltip: SYSTEM_ROLES.guest.description,
        };
      default:
        return {
          icon: <User className="mr-1 h-3 w-3" />,
          variant: 'outline' as const,
          tooltip: SYSTEM_ROLES.user.description,
        };
    }
  };

  const { icon, variant, tooltip } = getIconAndVariant();

  const badge = (
    <Badge variant={variant} className={`capitalize ${className}`} {...props}>
      {showIcon && icon}
      {getRoleDisplayName((role || 'user') as SystemRole)}
    </Badge>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
