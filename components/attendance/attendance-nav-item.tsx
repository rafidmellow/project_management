'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Clock,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  BarChart2,
  Home,
  Users,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClientPermissionService } from '@/lib/permissions/client-permission-service';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AttendanceNavItemProps {
  collapsed?: boolean;
}

export function AttendanceNavItem({ collapsed = false }: AttendanceNavItemProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(pathname.startsWith('/attendance'));

  const { data: session } = useSession();
  const userRole = session?.user?.role || 'user';
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  // Fetch user permissions
  useEffect(() => {
    if (!session?.user?.id) return;

    // Set default permissions for basic navigation
    setUserPermissions(['view_dashboard', 'view_attendance', 'edit_profile']);

    // Fetch from API for complete permissions
    fetch('/api/users/permissions')
      .then(res => res.json())
      .then(data => {
        if (data.permissions && Array.isArray(data.permissions)) {
          setUserPermissions(data.permissions);
        }
      })
      .catch(err => {
        console.error('Error fetching permissions:', err);
      });
  }, [session, userRole]);

  const subItems = [
    {
      title: 'Dashboard',
      href: '/attendance/dashboard',
      icon: Home,
      permission: 'view_dashboard', // Basic permission everyone has
    },
    {
      title: 'History',
      href: '/attendance/history',
      icon: ClipboardCheck,
      permission: 'view_attendance', // Basic permission everyone has
    },
    {
      title: 'Statistics',
      href: '/attendance/statistics',
      icon: BarChart2,
      permission: 'view_attendance', // Basic permission everyone has
    },
    {
      title: 'Settings',
      href: '/attendance/settings',
      icon: Settings,
      permission: 'edit_profile', // Basic permission everyone has
    },
    {
      title: 'Admin',
      href: '/attendance/admin',
      icon: Users,
      permission: 'attendance_management', // Admin-only permission
    },
  ];

  // Filter items based on user permissions
  const filteredSubItems = subItems.filter(item => {
    // For basic navigation items that everyone should see, include them even if permissions aren't loaded yet
    if (['view_dashboard', 'view_attendance', 'edit_profile'].includes(item.permission)) {
      return true;
    }

    // For restricted items, check permissions
    return userPermissions.includes(item.permission);
  });

  const isActive = pathname.startsWith('/attendance');

  if (collapsed) {
    return (
      <Link
        href="/attendance"
        className={cn(
          'group flex items-center justify-center rounded-md text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
          'size-10 mx-auto'
        )}
        title="Attendance"
      >
        <Clock className="size-5" />
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
          <Clock className="size-5 mr-3" />
          <span>Attendance</span>
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
