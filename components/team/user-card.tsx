'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  MoreHorizontal,
  Edit,
  Trash,
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/ui/role-badge';
import { useHasPermission } from '@/hooks/use-has-permission';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { UserSummary } from '@/types/user';

interface UserCardProps {
  user: UserSummary & {
    createdAt?: string;
  };
  onDelete: (userId: string) => void;
}

export function UserCard({ user, onDelete }: UserCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  // Use permission-based checks instead of role-based checks
  const { hasPermission: canEditUsers } = useHasPermission('user_edit');
  const { hasPermission: canManageRoles } = useHasPermission('manage_roles');
  const { hasPermission: canDeleteUsers } = useHasPermission('user_delete');

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user.name) return 'U';

    const nameParts = user.name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }

    return nameParts[0].substring(0, 2).toUpperCase();
  };

  // Get role badge variant
  const getRoleBadgeVariant = () => {
    switch (user.role.toLowerCase()) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      case 'contributor':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div
      className="relative rounded-lg border-0 bg-card text-card-foreground shadow-xs transition-all hover:shadow-md hover:border-primary/20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <Link href={`/profile/${user.id}`} className="flex items-center gap-3 group">
            <Avatar className="h-12 w-12 border border-black/10">
              {user.image ? <AvatarImage src={user.image} alt={user.name || 'User'} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium group-hover:text-primary transition-colors text-base">
                {user.name || 'Unnamed User'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
            </div>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/profile/${user.id}`} className="cursor-pointer">
                  <UserIcon className="mr-2 h-4 w-4" />
                  View Profile
                </Link>
              </DropdownMenuItem>
              {canEditUsers && (
                <DropdownMenuItem asChild>
                  <Link href={`/team/edit/${user.id}`} className="cursor-pointer">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit User
                  </Link>
                </DropdownMenuItem>
              )}
              {canManageRoles && (
                <DropdownMenuItem asChild>
                  <Link href={`/team/roles?userId=${user.id}`} className="cursor-pointer">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Manage Role
                  </Link>
                </DropdownMenuItem>
              )}
              {canDeleteUsers && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(user.id)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete User
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <RoleBadge role={user.role} type="system" />

            {isHovered && (
              <div className="ml-auto">
                <Button variant="outline" size="sm" className="h-7 rounded-full" asChild>
                  <Link href={`/profile/${user.id}`}>View Profile</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <Mail className="mr-2 h-4 w-4" />
            <span className="truncate">{user.email}</span>
          </div>

          {user.createdAt && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              <span>
                Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
