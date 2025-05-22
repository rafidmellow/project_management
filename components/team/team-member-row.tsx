'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/ui/role-badge';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Briefcase, MoreHorizontal, Trash, UserCircle } from 'lucide-react';
import { TeamMemberWithProjects, User } from './team-types';

interface TeamMemberRowProps {
  member: TeamMemberWithProjects;
  currentUserId?: string;
  canDeleteTeamMembers: boolean;
  onDeleteClick: (member: TeamMemberWithProjects) => void;
}

/**
 * A memoized row component for displaying a team member in the table
 * Only re-renders when the member data or permissions change
 */
export const TeamMemberRow = memo(function TeamMemberRow({
  member,
  currentUserId,
  canDeleteTeamMembers,
  onDeleteClick,
}: TeamMemberRowProps) {
  // Get user initials for avatar fallback
  const getUserInitials = (name: string | null): string => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <TableRow className="hover:bg-muted/5 border-b border-border">
      <TableCell className="py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={member.user?.image || ''} alt={member.user?.name || 'Team member'} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
              {getUserInitials(member.user?.name || null)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-foreground">{member.user?.name || 'Unknown'}</div>
            <div className="text-xs text-muted-foreground">{member.user?.email}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <RoleBadge role={member.user?.role || 'user'} />
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1.5 max-w-[300px]">
          {member.projects?.map(project => (
            <Link
              key={project?.id}
              href={`/projects/${project?.id}`}
              className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <Briefcase className="h-3 w-3 mr-1 text-foreground/70" />
              <span className="truncate max-w-[150px] text-foreground/90">{project?.title}</span>
            </Link>
          ))}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Open menu">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs font-medium">Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/profile/${member.user?.id}`} className="cursor-pointer">
                <UserCircle className="mr-2 h-4 w-4" />
                View Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/projects/${member.project?.id}`} className="cursor-pointer">
                <Briefcase className="mr-2 h-4 w-4" />
                View Project
              </Link>
            </DropdownMenuItem>
            {canDeleteTeamMembers && member.user?.id !== currentUserId && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => onDeleteClick(member)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Remove from Team
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});
