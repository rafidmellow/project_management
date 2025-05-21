'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { checkOutAndLogout } from '@/lib/logout-utils';

interface UserNavProps {
  compact?: boolean;
  showName?: boolean;
  className?: string;
}

export function UserNav({ compact = false, showName = true, className }: UserNavProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
    : 'AU';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'relative w-full transition-colors',
            compact ? 'h-10 px-2 justify-center' : 'h-10 px-3',
            className
          )}
        >
          <div className={cn('flex items-center w-full', compact ? 'justify-center' : 'gap-3')}>
            <Avatar className="size-8 shrink-0">
              <AvatarImage src={user?.image || undefined} alt={user?.name ?? ''} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>

            {showName && (
              <div className="flex flex-col items-start text-left overflow-hidden">
                <span className="text-sm font-medium leading-tight truncate w-full">
                  {user?.name || 'Admin User'}
                </span>
                <span className="text-xs text-muted-foreground leading-tight mt-1 truncate w-full">
                  {user?.role || 'Admin'}
                </span>
              </div>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || 'Admin User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || 'admin@example.com'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={`/profile/${session?.user?.id}`}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => checkOutAndLogout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
