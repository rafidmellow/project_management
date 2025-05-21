'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LayoutDashboard, Briefcase, CheckSquare, Users, UserCircle, Clock } from 'lucide-react';
import { AttendanceNavItem } from '@/components/attendance/attendance-nav-item';
import { TeamNavItem } from '@/components/team/team-nav-item';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  isExpandable?: boolean;
}

function getNavItems(userId?: string): NavItem[] {
  return [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Projects',
      href: '/projects',
      icon: Briefcase,
    },
    {
      title: 'Tasks',
      href: '/tasks',
      icon: CheckSquare,
    },
    {
      title: 'Team',
      href: '/team',
      icon: Users,
      isExpandable: true,
    },
    {
      title: 'Attendance',
      href: '/attendance',
      icon: Clock,
      isExpandable: true,
    },
  ];
}

interface DashboardNavProps {
  collapsed?: boolean;
}

export function DashboardNav({ collapsed = false }: DashboardNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const navItems = getNavItems(userId);

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="flex flex-col gap-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          if (item.title === 'Attendance') {
            return <AttendanceNavItem key={item.href} collapsed={collapsed} />;
          }

          if (item.title === 'Team') {
            return <TeamNavItem key={item.href} collapsed={collapsed} />;
          }

          const navLink = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                collapsed ? 'justify-center size-10 mx-auto' : 'px-3 py-2 h-10'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn('shrink-0', collapsed ? 'size-5' : 'size-5 mr-3')}
                aria-hidden="true"
              />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );

          // Wrap with tooltip only when collapsed
          return collapsed ? (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{navLink}</TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {item.title}
              </TooltipContent>
            </Tooltip>
          ) : (
            navLink
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
