'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Users,
  ChevronDown,
  ChevronRight,
  UserCircle,
  UsersRound,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TeamNavItemProps {
  collapsed?: boolean;
}

export function TeamNavItem({ collapsed = false }: TeamNavItemProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(
    pathname.startsWith('/team') || pathname.startsWith('/profile')
  );
  const userId = session?.user?.id;
  const userRole = session?.user?.role || 'user';

  // Define menu items with their required permissions
  const subItems = [
    {
      title: 'Team Members',
      href: '/team/members',
      icon: UsersRound,
      permission: 'team_view',
      // This is a core functionality that all users should have access to
      alwaysShow: true,
      category: 'team',
    },
    {
      title: 'My Profile',
      href: userId ? `/profile/${userId}` : '/profile',
      icon: UserCircle,
      permission: 'edit_profile',
      // This is a core functionality that all users should have access to
      alwaysShow: true,
      category: 'profile',
    },
    {
      title: 'User Management',
      href: '/team/users',
      icon: UsersRound,
      permission: 'user_management',
      alwaysShow: false,
      category: 'users',
    },
    {
      title: 'Role Management',
      href: '/team/roles',
      icon: ShieldCheck,
      permission: 'manage_roles',
      alwaysShow: false,
      category: 'roles',
    },
    {
      title: 'Permissions',
      href: '/team/permissions',
      icon: ShieldCheck,
      permission: 'manage_permissions',
      alwaysShow: false,
      category: 'roles',
    },
  ];

  // Filter items based on user permissions
  const filteredSubItems = subItems.filter(item => {
    if (item.alwaysShow) return true;

    // Use the basic permissions for admin role directly
    const hasPermission =
      userRole === 'admin'
        ? true
        : userRole === 'manager'
          ? ['team_view', 'team_add', 'team_management', 'user_management'].includes(
              item.permission
            )
          : ['team_view'].includes(item.permission);

    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`Permission check for ${item.title}: ${item.permission} = ${hasPermission}`);
    }

    // Always show these items for admin users regardless of permission check
    if (
      userRole === 'admin' &&
      ['Add Member', 'Role Management', 'Permissions'].includes(item.title)
    ) {
      return true;
    }

    return hasPermission;
  });

  const isActive = pathname.startsWith('/team') || pathname.startsWith('/profile');

  if (collapsed) {
    return (
      <Link
        href="/team"
        className={cn(
          'group flex items-center justify-center rounded-md text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
          'size-10 mx-auto'
        )}
        title="Team"
      >
        <Users className="size-5" />
      </Link>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between rounded-md text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
          'px-3 py-2 h-10'
        )}
      >
        <div className="flex items-center">
          <Users className="size-5 mr-3" />
          <span>Team</span>
        </div>
        {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-8 pr-2">
        <div className="flex flex-col gap-2 pt-2">
          {filteredSubItems.map(item => {
            const Icon = item.icon;
            const subItemActive = pathname === item.href || pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center rounded-md py-2 px-3 text-sm transition-colors',
                  subItemActive
                    ? 'bg-accent/50 text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground'
                )}
              >
                <Icon className="size-4 mr-3" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
