'use client';

import { useState, useEffect } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface AssignMembersPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUserIds: string[];
  onAssign: (userIds: string[]) => void;
}

export function AssignMembersPopup({
  open,
  onOpenChange,
  selectedUserIds,
  onAssign,
}: AssignMembersPopupProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>(selectedUserIds);
  const { toast } = useToast();

  // Fetch team members when the popup opens
  useEffect(() => {
    if (open) {
      fetchTeamMembers();
    }
  }, [open]);

  // Update selected users when selectedUserIds prop changes
  useEffect(() => {
    setSelectedUsers(selectedUserIds);
  }, [selectedUserIds]);

  // Fetch team members for the project
  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);
      // Get the project ID from the current URL
      const projectId = window.location.pathname.split('/')[2];
      if (!projectId) {
        throw new Error('Could not determine project ID');
      }

      // Use the team-management API endpoint with projectId as a query parameter
      const response = await fetch(`/api/team-management?projectId=${projectId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }

      const data = await response.json();

      if (data.teamMembers && Array.isArray(data.teamMembers)) {
        // Extract user data from team members
        const teamUsers = data.teamMembers
          .map((tm: any) => tm.user)
          .filter((user: any) => user && user.id);

        setUsers(teamUsers);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch team members',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle user selection
  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Apply changes when the popup is closed
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && JSON.stringify(selectedUsers) !== JSON.stringify(selectedUserIds)) {
      // Only update if there are changes
      onAssign(selectedUsers);
    }
    onOpenChange(newOpen);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {/* This div is now hidden and only used as a trigger for the popover */}
        <div className="sr-only">
          <Plus className="h-4 w-4 text-black" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="end" side="top" style={{ zIndex: 100 }}>
        <div className="p-2 border-b">
          <h4 className="text-sm font-medium">Assign Members</h4>
          <p className="text-xs text-muted-foreground">
            Select team members to assign to this task
          </p>
        </div>
        <Command>
          <CommandInput placeholder="Search members..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Spinner className="h-4 w-4 mr-2" />
                  Loading...
                </div>
              ) : (
                'No members found'
              )}
            </CommandEmpty>
            <CommandGroup>
              {users.map(user => (
                <CommandItem
                  key={user.id}
                  onSelect={() => toggleUser(user.id)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleUser(user.id)}
                    />
                    <Avatar className="h-6 w-6 border border-black">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {user.name?.substring(0, 2) || user.email.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate">{user.name || user.email}</span>
                  </div>
                  {selectedUsers.includes(user.id) && <Check className="h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
