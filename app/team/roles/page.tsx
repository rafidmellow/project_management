'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SYSTEM_ROLES } from '@/lib/roles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreHorizontal,
  ShieldCheck,
  ShieldAlert,
  Shield,
  UserCog,
  HelpCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Use centralized role definitions
const ROLES = [
  {
    id: 'user',
    name: SYSTEM_ROLES.user.name,
    description: SYSTEM_ROLES.user.description,
    color: SYSTEM_ROLES.user.color,
  },
  {
    id: 'manager',
    name: SYSTEM_ROLES.manager.name,
    description: SYSTEM_ROLES.manager.description,
    color: SYSTEM_ROLES.manager.color,
  },
  {
    id: 'admin',
    name: SYSTEM_ROLES.admin.name,
    description: SYSTEM_ROLES.admin.description,
    color: SYSTEM_ROLES.admin.color,
  },
];

export default function RoleManagementPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Check if user has permission to manage roles
  useEffect(() => {
    if (!session) return;

    // Check if user has the required permission
    const checkPermission = async () => {
      try {
        const response = await fetch(`/api/users/check-permission?permission=manage_roles`);
        const data = await response.json();

        if (!data.hasPermission) {
          toast({
            title: 'Access Denied',
            description: "You don't have permission to access this page",
            variant: 'destructive',
          });
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking permission:', error);
        // If there's an error checking permission, redirect to be safe
        router.push('/dashboard');
      }
    };

    checkPermission();
  }, [session, router, toast]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        // API returns { users: [...] }
        if (data && data.users && Array.isArray(data.users)) {
          setUsers(data.users);
        } else if (Array.isArray(data)) {
          // If API directly returns an array
          setUsers(data);
        } else {
          // Fallback to empty array
          setUsers([]);
          console.error('Unexpected data format:', data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: 'Failed to load users',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    // Only fetch users if session exists
    if (session) {
      fetchUsers();
    }
  }, [session, toast]);

  // Filter users based on search query
  const filteredUsers = Array.isArray(users)
    ? users.filter(
        user =>
          (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
          (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      )
    : [];

  // Handle role change
  const handleRoleChange = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: selectedRole,
        }),
      });

      if (!response.ok) throw new Error('Failed to update user role');

      // Update local state
      if (Array.isArray(users)) {
        setUsers(
          users.map(user => (user.id === selectedUser.id ? { ...user, role: selectedRole } : user))
        );
      }

      toast({
        title: 'Role Updated',
        description: `${selectedUser.name}'s role has been updated to ${selectedRole}`,
      });

      setDialogOpen(false);
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  // Get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-purple-500 hover:bg-purple-600">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      case 'manager':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <Shield className="h-3 w-3 mr-1" />
            Manager
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <UserCog className="h-3 w-3 mr-1" />
            User
          </Badge>
        );
    }
  };

  // We'll use the useEffect hook to handle permission checking and redirection
  // No need for an early return here as the useEffect will handle unauthorized access

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <Link href="/team/roles/help">
          <Button variant="outline" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Understanding Roles
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>User Roles</CardTitle>
              <CardDescription>Assign roles to control access levels for users</CardDescription>
            </div>
            <Link
              href="/team/roles/help"
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              Help
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || 'Unnamed User'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setSelectedRole(user.role);
                                setDialogOpen(true);
                              }}
                            >
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>Update role for {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full ${role.color} mr-2`}></div>
                      {role.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              {ROLES.find(r => r.id === selectedRole)?.description ||
                'Select a role to see its description'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
