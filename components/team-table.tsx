'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/ui/role-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, MoreHorizontal, Search, Filter } from 'lucide-react';
import { useTeamMembers, useRemoveTeamMember } from '@/hooks/use-team-management';
import { Input } from '@/components/ui/input';
import { teamManagementApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { RoleManagementDialog } from '@/components/team/role-management-dialog';

interface TeamTableProps {
  projectId?: string;
}

export function TeamTable({ projectId }: TeamTableProps) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const { teamMembers, isLoading, isError, mutate, pagination } = useTeamMembers(
    projectId,
    page,
    10
  );
  const { toast } = useToast();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null);

  // Define TeamMember type to match the one in RoleManagementDialog
  type TeamMember = {
    id: string;
    projectId: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      role: string;
    };
    project: {
      id: string;
      title: string;
    };
    createdAt: string | Date;
    taskCount?: number;
  };

  // Use the removeTeamMember hook
  const { removeTeamMember, isRemoving, error: removeError } = useRemoveTeamMember();

  // Handle member removal
  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      try {
        await removeTeamMember(memberId);
        toast({
          title: 'Team member removed',
          description: 'The team member has been removed from the project',
        });
        mutate(); // Refresh the data
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to remove team member',
          variant: 'destructive',
        });
      }
    }
  };

  // Function to handle search (for a complete implementation, this would need backend support)
  const handleSearch = () => {
    // In a real implementation, you'd pass this to the API
    console.log('Searching for:', searchQuery);
  };

  // Role badge styling is now handled by the RoleBadge component

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading team members. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search team members..."
              className="pl-8"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button variant="outline" size="icon" title="Filter">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Tasks</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                <Spinner className="mx-auto" />
                <div className="mt-2 text-sm text-muted-foreground">Loading team members...</div>
              </TableCell>
            </TableRow>
          ) : teamMembers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                <div className="text-muted-foreground">No team members found</div>
              </TableCell>
            </TableRow>
          ) : (
            teamMembers.map((member: any) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.user?.image || ''} alt={member.user?.name || ''} />
                      <AvatarFallback>
                        {member.user?.name
                          ?.split(' ')
                          .map((n: string) => n[0])
                          .join('') || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{member.user?.name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">{member.user?.id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{member.user?.email || 'No email'}</TableCell>
                <TableCell>
                  <RoleBadge role={member.user?.role || 'user'} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{member.taskCount || 0} tasks</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => window.open(`/team/profile/${member.user?.id}`, '_blank')}
                      >
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedTeamMember(member);
                          setRoleDialogOpen(true);
                        }}
                      >
                        View Role
                      </DropdownMenuItem>
                      <DropdownMenuItem>Assign Tasks</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page => Math.max(1, page - 1))}
            disabled={page === 1 || isLoading}
          >
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page => Math.min(pagination.totalPages, page + 1))}
            disabled={page === pagination.totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}

      {/* Role Management Dialog */}
      <RoleManagementDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        teamMember={selectedTeamMember}
        onSuccess={mutate}
      />
    </div>
  );
}
