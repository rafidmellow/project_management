'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, ShieldCheck, ShieldAlert, Users, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/ui/role-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function RolesHelpPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/team/roles"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Role Management
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Understanding Roles</h1>
          <p className="text-muted-foreground">
            Learn about the different types of roles in the system
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role System Overview</CardTitle>
          <CardDescription>
            Our application uses a unified role system to manage permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="prose max-w-none">
              <h3>User Roles</h3>
              <p>
                User roles apply across the entire application and determine what features a user
                can access. These roles are assigned at the user level and affect all interactions
                with the system.
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <RoleBadge role="admin" showTooltip={false} />
                  </TableCell>
                  <TableCell>
                    System administrators with full access to all features and settings
                  </TableCell>
                  <TableCell>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Manage all users and their roles</li>
                      <li>Access all projects and settings</li>
                      <li>Configure system-wide settings</li>
                      <li>Manage permissions and roles</li>
                    </ul>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <RoleBadge role="manager" showTooltip={false} />
                  </TableCell>
                  <TableCell>
                    System managers with elevated access to manage users and projects
                  </TableCell>
                  <TableCell>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Create and manage projects</li>
                      <li>Manage users (except admins)</li>
                      <li>View system reports</li>
                      <li>Limited system configuration</li>
                    </ul>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <RoleBadge role="user" showTooltip={false} />
                  </TableCell>
                  <TableCell>
                    Regular users with standard access to projects they're assigned to
                  </TableCell>
                  <TableCell>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Access assigned projects</li>
                      <li>Manage own profile</li>
                      <li>Create and manage tasks</li>
                      <li>View team members</li>
                    </ul>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role-Based Access Control</CardTitle>
          <CardDescription>
            Understanding how roles determine permissions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <h3>Permission System</h3>
            <p>User roles determine what features and actions a user can access:</p>

            <ul>
              <li>
                <strong>User roles</strong> determine what features a user can access across the
                entire application.
              </li>
              <li>
                <strong>Team membership</strong> determines which projects a user can access.
              </li>
            </ul>

            <h3>Examples</h3>

            <div className="bg-muted p-4 rounded-md my-4">
              <h4 className="text-lg font-medium mb-2">Example 1: Admin User</h4>
              <p>
                A user with the <RoleBadge role="admin" showTooltip={false} /> role has access to
                all features and can manage all projects, even if they aren't explicitly added as a
                team member.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-md my-4">
              <h4 className="text-lg font-medium mb-2">Example 2: Manager User</h4>
              <p>
                A user with the <RoleBadge role="manager" showTooltip={false} /> role can create
                projects and manage users, but they can only access projects where they are added as
                a team member.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-md my-4">
              <h4 className="text-lg font-medium mb-2">Example 3: Regular User</h4>
              <p>
                A user with the <RoleBadge role="user" showTooltip={false} /> role can only access
                projects where they have been added as a team member, and they have limited
                permissions within those projects.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
