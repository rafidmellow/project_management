'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  XCircle,
  Edit,
  Info,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Plus,
  UserPlus,
  Loader2,
  Save,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ClientPermissionService } from '@/lib/permissions/client-permission-service';

// Default role data (will be replaced with data from API)
const ROLE_DATA = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access',
    color: 'bg-purple-500',
    count: 1,
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Project and team management',
    color: 'bg-green-500',
    count: 1,
  },
  {
    id: 'user',
    name: 'User',
    description: 'Standard user access',
    color: 'bg-blue-500',
    count: 2,
  },
  {
    id: 'guest',
    name: 'Guest',
    description: 'Limited view-only access',
    color: 'bg-gray-500',
    count: 0,
  },
];

// Default permission data (will be replaced with data from API)
const PERMISSION_DATA = [
  {
    id: 'user_management',
    name: 'User Management',
    description: 'Permission to manage users',
    category: 'User',
  },
  {
    id: 'manage_roles',
    name: 'Manage Roles',
    description: 'Permission to manage roles and permissions',
    category: 'User',
  },
  {
    id: 'project_creation',
    name: 'Project Creation',
    description: 'Permission to create new projects',
    category: 'Project',
  },
  {
    id: 'team_view',
    name: 'Team View',
    description: 'Permission to view team members',
    category: 'Team',
  },
];

// Permission badges for the roles table - key highlights for each role
const PERMISSION_BADGES = {
  admin: [
    { id: 'full_access', name: 'Full Access', color: 'bg-purple-500' },
    { id: 'user_management', name: 'User Management', color: 'bg-blue-500' },
    { id: 'system_settings', name: 'System Settings', color: 'bg-red-500' },
  ],
  manager: [
    { id: 'user_management', name: 'User Management', color: 'bg-blue-500' },
    { id: 'project_management', name: 'Project Management', color: 'bg-green-500' },
    { id: 'task_assignment', name: 'Task Assignment', color: 'bg-yellow-500' },
  ],
  user: [
    { id: 'task_management', name: 'Task Management', color: 'bg-yellow-500' },
    { id: 'project_view', name: 'Project View', color: 'bg-green-500' },
    { id: 'profile_edit', name: 'Profile Edit', color: 'bg-blue-500' },
  ],
  guest: [
    { id: 'limited_view', name: 'Limited View', color: 'bg-gray-500' },
    { id: 'profile_view', name: 'Profile View', color: 'bg-blue-500' },
  ],
};

export default function RolePermissionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('roles');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  // Empty permission matrix - will be populated from API
  const DEFAULT_PERMISSION_MATRIX: Record<string, string[]> = {};

  const [rolePermissions, setRolePermissions] =
    useState<Record<string, string[]>>(DEFAULT_PERMISSION_MATRIX);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Check if user has permission to manage permissions
  useEffect(() => {
    if (!session) return;

    // Check if user has the required permission
    const checkPermission = async () => {
      try {
        const response = await fetch(`/api/users/check-permission?permission=manage_permissions`);
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

  // Handle permission toggle
  const togglePermission = (role: string, permission: string) => {
    setRolePermissions(prev => {
      const newPermissions = { ...prev };

      // Initialize the role's permissions array if it doesn't exist
      if (!newPermissions[role]) {
        newPermissions[role] = [];
      }

      if (newPermissions[role].includes(permission)) {
        // Remove permission
        newPermissions[role] = newPermissions[role].filter(p => p !== permission);
      } else {
        // Add permission
        newPermissions[role] = [...newPermissions[role], permission];
      }

      return newPermissions;
    });

    // Mark that we have unsaved changes
    setHasUnsavedChanges(true);
    // Reset save success message when changes are made
    setSaveSuccess(false);
  };

  const [allPermissions, setAllPermissions] = useState<any[]>(PERMISSION_DATA);
  const [allRoles, setAllRoles] = useState<any[]>(ROLE_DATA);
  const [loading, setLoading] = useState(true);
  const [newPermissionDialogOpen, setNewPermissionDialogOpen] = useState(false);
  const [newPermissionData, setNewPermissionData] = useState({
    name: '',
    description: '',
    category: 'general',
  });
  const [newRoleDialogOpen, setNewRoleDialogOpen] = useState(false);
  const [newRoleData, setNewRoleData] = useState({
    name: '',
    description: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch role permissions from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all roles first
        try {
          const allRolesResponse = await fetch('/api/roles');
          if (allRolesResponse.ok) {
            const allRolesData = await allRolesResponse.json();
            setAllRoles(allRolesData.length > 0 ? allRolesData : ROLE_DATA);
          } else {
            console.warn('Using default roles due to API error');
            setAllRoles(ROLE_DATA);
          }
        } catch (error) {
          console.warn('Using default roles due to API error:', error);
          setAllRoles(ROLE_DATA);
        }

        // Fetch all permissions
        try {
          const allPermissionsResponse = await fetch('/api/permissions');
          if (allPermissionsResponse.ok) {
            const allPermissionsData = await allPermissionsResponse.json();
            setAllPermissions(allPermissionsData.length > 0 ? allPermissionsData : PERMISSION_DATA);
          } else {
            console.warn('Using default permissions due to API error');
            setAllPermissions(PERMISSION_DATA);
          }
        } catch (error) {
          console.warn('Using default permissions due to API error:', error);
          setAllPermissions(PERMISSION_DATA);
        }

        // Fetch permissions matrix
        try {
          const permissionsResponse = await fetch('/api/roles/permissions');
          if (permissionsResponse.ok) {
            const permissionsData = await permissionsResponse.json();
            setRolePermissions(
              Object.keys(permissionsData).length > 0 ? permissionsData : DEFAULT_PERMISSION_MATRIX
            );
          } else {
            console.warn('Using default permission matrix due to API error');
            setRolePermissions(DEFAULT_PERMISSION_MATRIX);
          }
        } catch (error) {
          console.warn('Using default permission matrix due to API error:', error);
          setRolePermissions(DEFAULT_PERMISSION_MATRIX);
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load role permissions',
          variant: 'destructive',
        });
        // Set default values if API calls fail
        setAllRoles(ROLE_DATA);
        setAllPermissions(PERMISSION_DATA);
        setRolePermissions(DEFAULT_PERMISSION_MATRIX);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchData();
    }
  }, [session, toast]);

  // Save role permissions
  const saveRolePermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/roles/permissions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: rolePermissions,
        }),
      });

      if (!response.ok) throw new Error('Failed to update permissions');

      toast({
        title: 'Permissions Updated',
        description: 'Role permissions have been updated successfully',
      });

      // Mark that changes are saved
      setHasUnsavedChanges(false);
      setSaveSuccess(true);

      // Close dialog if open
      if (editDialogOpen) {
        setEditDialogOpen(false);
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to update permissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new permission
  const createPermission = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPermissionData),
      });

      if (!response.ok) throw new Error('Failed to create permission');

      toast({
        title: 'Permission Created',
        description: `Permission '${newPermissionData.name}' has been created successfully`,
      });

      // Reset form and close dialog
      setNewPermissionData({ name: '', description: '', category: 'general' });
      setNewPermissionDialogOpen(false);

      // Refresh data
      const allPermissionsResponse = await fetch('/api/permissions');
      if (!allPermissionsResponse.ok) throw new Error('Failed to fetch all permissions');
      const allPermissionsData = await allPermissionsResponse.json();
      setAllPermissions(allPermissionsData);
    } catch (error) {
      console.error('Error creating permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to create permission',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new role
  const createRole = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRoleData),
      });

      if (!response.ok) throw new Error('Failed to create role');

      toast({
        title: 'Role Created',
        description: `Role '${newRoleData.name}' has been created successfully`,
      });

      // Reset form and close dialog
      setNewRoleData({ name: '', description: '' });
      setNewRoleDialogOpen(false);

      // Refresh data
      const allRolesResponse = await fetch('/api/roles');
      if (!allRolesResponse.ok) throw new Error('Failed to fetch all roles');
      const allRolesData = await allRolesResponse.json();
      setAllRoles(allRolesData);

      // Update permission matrix
      const permissionsResponse = await fetch('/api/roles/permissions');
      if (!permissionsResponse.ok) throw new Error('Failed to fetch permissions');
      const permissionsData = await permissionsResponse.json();
      setRolePermissions(permissionsData);
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to create role',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get role badge
  const getRoleBadge = (roleId: string) => {
    // Find the role in allRoles
    const role = allRoles.find(r => r.id === roleId);
    if (!role) return null;

    // Use the role's color if available, or default to a standard color
    const colorClass = role.color || 'bg-blue-500 hover:bg-blue-600';

    return (
      <Badge className={colorClass}>
        <Shield className="h-3 w-3 mr-1" />
        {role.name}
      </Badge>
    );
  };

  // We'll use the useEffect hook to handle permission checking and redirection
  // No need for an early return here as the useEffect will handle unauthorized access

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Roles Management</h1>
          <p className="text-muted-foreground">Manage user roles and their permissions</p>
        </div>
      </div>

      <Tabs defaultValue="roles" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full">
          <TabsTrigger value="roles" className="flex-1">
            Available Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex-1">
            Permissions Matrix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Roles</CardTitle>
              <CardDescription>
                These roles define what users can access and modify within the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allRoles.map(role => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <div className={`h-3 w-3 rounded-full ${role.color}`}></div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {PERMISSION_BADGES[role.id as keyof typeof PERMISSION_BADGES]?.map(
                              badge => (
                                <Badge key={badge.id} className={`${badge.color} text-white`}>
                                  {badge.name}
                                </Badge>
                              )
                            ) || <Badge variant="outline">Custom Role</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="rounded-full">
                            {role.count || 0}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Role Permissions Matrix</CardTitle>
                  <CardDescription>Detailed breakdown of permissions by role</CardDescription>
                </div>
                <div className="w-full md:w-64">
                  <Input
                    placeholder="Search permissions..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto max-h-[70vh] w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="min-w-[150px] sticky left-0 bg-background z-20">
                        Permission
                      </TableHead>
                      {allRoles.map(role => (
                        <TableHead key={role.id} className="text-center min-w-[100px]">
                          {getRoleBadge(role.id)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Filter permissions based on search query */}
                    {(() => {
                      // Filter permissions based on search query
                      const filteredPermissions = searchQuery
                        ? allPermissions.filter(
                            p =>
                              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (p.description &&
                                p.description.toLowerCase().includes(searchQuery.toLowerCase()))
                          )
                        : allPermissions;

                      // Get unique categories from filtered permissions
                      const categories = Array.from(
                        new Set(filteredPermissions.map(p => p.category || 'General'))
                      ).sort();

                      return categories.map(category => (
                        <React.Fragment key={category}>
                          {/* Category header */}
                          <TableRow className="bg-muted/50">
                            <TableCell
                              colSpan={allRoles.length + 1}
                              className="font-bold sticky left-0 bg-muted/50 z-10"
                            >
                              {category}
                            </TableCell>
                          </TableRow>

                          {/* Permissions in this category */}
                          {filteredPermissions
                            .filter(p => (p.category || 'General') === category)
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(permission => (
                              <TableRow key={permission.id}>
                                <TableCell className="font-medium sticky left-0 bg-background z-10">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate max-w-[100px] xs:max-w-[120px] sm:max-w-[180px] md:max-w-none">
                                      {permission.name}
                                    </span>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                          <p className="max-w-[200px] sm:max-w-[300px]">
                                            {permission.description}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </TableCell>
                                {allRoles.map(role => (
                                  <TableCell key={role.id} className="text-center">
                                    {rolePermissions[role.id]?.includes(permission.id) ? (
                                      <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                                    ) : (
                                      <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                                    )}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                        </React.Fragment>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>

              {hasUnsavedChanges && (
                <Alert className="mb-4 border-yellow-500 bg-yellow-50">
                  <AlertTitle className="flex items-center text-yellow-800">
                    <Info className="h-4 w-4 mr-2" />
                    Unsaved Changes
                  </AlertTitle>
                  <AlertDescription className="text-yellow-800">
                    You have made changes to the permission matrix. Click "Save Changes" to apply
                    them.
                  </AlertDescription>
                </Alert>
              )}

              {saveSuccess && (
                <Alert className="mb-4 border-green-500 bg-green-50">
                  <AlertTitle className="flex items-center text-green-800">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Changes Saved
                  </AlertTitle>
                  <AlertDescription className="text-green-800">
                    Your changes to the permission matrix have been saved successfully.
                  </AlertDescription>
                </Alert>
              )}

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-row gap-2">
                <Button onClick={() => setEditDialogOpen(true)} className="w-full">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Permissions
                </Button>
                {hasUnsavedChanges && (
                  <Button
                    onClick={saveRolePermissions}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setNewPermissionDialogOpen(true)}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Permission
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setNewRoleDialogOpen(true)}
                  className="w-full"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Role
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Permissions Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <DialogTitle>Edit Role Permissions</DialogTitle>
                <DialogDescription>
                  Customize which permissions are granted to each role
                </DialogDescription>
              </div>
              <div className="w-full md:w-64">
                <Input
                  placeholder="Search permissions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </DialogHeader>
          <div className="py-4 grow overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading permissions...</span>
              </div>
            ) : (
              <div className="rounded-md border overflow-auto h-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="min-w-[150px] sticky left-0 bg-background z-20">
                        Permission
                      </TableHead>
                      {allRoles.map(role => (
                        <TableHead
                          key={role.id}
                          className="text-center min-w-[80px] sm:min-w-[100px]"
                        >
                          {getRoleBadge(role.id)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Filter permissions based on search query */}
                    {(() => {
                      // Filter permissions based on search query
                      const filteredPermissions = searchQuery
                        ? allPermissions.filter(
                            p =>
                              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (p.description &&
                                p.description.toLowerCase().includes(searchQuery.toLowerCase()))
                          )
                        : allPermissions;

                      // Get unique categories from filtered permissions
                      const categories = Array.from(
                        new Set(filteredPermissions.map(p => p.category || 'General'))
                      ).sort();

                      return categories.map(category => (
                        <React.Fragment key={category}>
                          {/* Category header */}
                          <TableRow className="bg-muted/50">
                            <TableCell
                              colSpan={allRoles.length + 1}
                              className="font-bold sticky left-0 bg-muted/50 z-10"
                            >
                              {category}
                            </TableCell>
                          </TableRow>

                          {/* Permissions in this category */}
                          {filteredPermissions
                            .filter(p => (p.category || 'General') === category)
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(permission => (
                              <TableRow key={permission.id}>
                                <TableCell className="font-medium sticky left-0 bg-background z-10">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate max-w-[100px] xs:max-w-[120px] sm:max-w-[180px] md:max-w-none">
                                      {permission.name}
                                    </span>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                          <p className="max-w-[200px] sm:max-w-[300px]">
                                            {permission.description}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </TableCell>
                                {allRoles.map(role => {
                                  const hasPermission = rolePermissions[role.id]?.includes(
                                    permission.id
                                  );
                                  return (
                                    <TableCell key={role.id} className="text-center p-2 sm:p-4">
                                      <Button
                                        variant={hasPermission ? 'default' : 'outline'}
                                        size="icon"
                                        className={`h-8 w-8 ${hasPermission ? 'bg-green-500 hover:bg-green-600' : ''}`}
                                        onClick={() => {
                                          togglePermission(role.id, permission.id);
                                          // Show toast for better feedback
                                          toast({
                                            title: hasPermission
                                              ? 'Permission Removed'
                                              : 'Permission Added',
                                            description: `${hasPermission ? 'Removed' : 'Added'} "${permission.name}" ${hasPermission ? 'from' : 'to'} the ${role.name} role`,
                                            variant: 'default',
                                          });
                                        }}
                                        disabled={role.id === 'admin'} // Admin always has all permissions
                                      >
                                        {hasPermission ? (
                                          <CheckCircle2 className="h-4 w-4" />
                                        ) : (
                                          <XCircle className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                        </React.Fragment>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button onClick={saveRolePermissions} disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Permission Dialog */}
      <Dialog open={newPermissionDialogOpen} onOpenChange={setNewPermissionDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Add New Permission</DialogTitle>
            <DialogDescription>
              Create a new permission that can be assigned to roles
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="permission-name">Permission Name</Label>
              <Input
                id="permission-name"
                placeholder="e.g. manage_projects"
                value={newPermissionData.name}
                onChange={e => setNewPermissionData({ ...newPermissionData, name: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Use lowercase letters and underscores, no spaces
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="permission-description">Description</Label>
              <Textarea
                id="permission-description"
                placeholder="Describe what this permission allows"
                value={newPermissionData.description}
                onChange={e =>
                  setNewPermissionData({ ...newPermissionData, description: e.target.value })
                }
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permission-category">Category</Label>
              <Select
                value={newPermissionData.category}
                onValueChange={value =>
                  setNewPermissionData({ ...newPermissionData, category: value })
                }
              >
                <SelectTrigger id="permission-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="projects">Projects</SelectItem>
                  <SelectItem value="tasks">Tasks</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setNewPermissionDialogOpen(false)}
              className="w-full"
            >
              Cancel
            </Button>
            <Button
              onClick={createPermission}
              disabled={loading || !newPermissionData.name}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Permission'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Role Dialog */}
      <Dialog open={newRoleDialogOpen} onOpenChange={setNewRoleDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>Create a new role with custom permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                placeholder="e.g. project_manager"
                value={newRoleData.name}
                onChange={e => setNewRoleData({ ...newRoleData, name: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Use lowercase letters and underscores, no spaces
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                placeholder="Describe this role's responsibilities"
                value={newRoleData.description}
                onChange={e => setNewRoleData({ ...newRoleData, description: e.target.value })}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setNewRoleDialogOpen(false)}
              className="w-full"
            >
              Cancel
            </Button>
            <Button onClick={createRole} disabled={loading || !newRoleData.name} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
