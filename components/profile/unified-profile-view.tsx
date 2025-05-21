'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserProfile } from '@/hooks/use-user-profile';
import { UnifiedProfileHeader } from '@/components/profile/unified-profile-header';
import { UnifiedProfileDetails } from '@/components/profile/unified-profile-details';
import { UserProjectRoles } from '@/components/profile/user-project-roles';
import { UserAttendanceSummary } from '@/components/profile/user-attendance-summary';
import { UserDocumentList } from '@/components/profile/user-document-list';
import { UserProfileProjects } from '@/components/profile/user-profile-projects';
import { UserProfileTasks } from '@/components/profile/user-profile-tasks';
import { UserProfileActivity } from '@/components/profile/user-profile-activity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useRef } from 'react';

interface UnifiedProfileViewProps {
  profile: UserProfile;
  projects: any[];
  tasks: any[];
  activities: any[];
  teamMemberships?: any[];
  stats: {
    projectCount: number;
    taskCount: number;
    teamCount: number;
    completionRate: string;
  };
  canEdit: boolean;
  isOwnProfile: boolean;
  isLoading?: boolean;
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
  onUploadImage: (file: File) => Promise<string | null>;
}

export function UnifiedProfileView({
  profile,
  projects,
  tasks,
  activities,
  teamMemberships = [],
  stats,
  canEdit,
  isOwnProfile,
  isLoading = false,
  onUpdateProfile,
  onUploadImage,
}: UnifiedProfileViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const file = files[0];
        console.log('File selected:', file.name);

        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        // Upload the file
        const response = await fetch(`/api/users/${profile.id}/documents`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload document');
        }

        // Clear the input value so the same file can be selected again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Refresh the document list (this would be handled by the UserDocumentList component)
      } catch (error) {
        console.error('Error uploading document:', error);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <UnifiedProfileHeader
        user={profile}
        canEdit={canEdit}
        isOwnProfile={isOwnProfile}
        isLoading={isLoading}
        stats={stats}
        onUpdateProfile={onUpdateProfile}
        onUploadImage={onUploadImage}
      />

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex flex-wrap">
          <TabsTrigger value="overview" className="flex-1 min-w-[100px]">
            Overview
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex-1 min-w-[100px]">
            Attendance
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex-1 min-w-[100px]">
            Documents
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex-1 min-w-[100px]">
            Projects
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex-1 min-w-[100px]">
            Tasks
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1 min-w-[100px]">
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {/* Profile Details */}
            <div className="lg:col-span-2">
              <UnifiedProfileDetails
                profile={profile}
                canEdit={canEdit}
                isLoading={isLoading}
                onUpdateProfile={onUpdateProfile}
              />
            </div>

            {/* Project Roles */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Project Memberships</CardTitle>
                </CardHeader>
                <CardContent>
                  <UserProjectRoles userId={profile.id} teamMemberships={teamMemberships} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="mt-6">
          <div className="grid gap-6 md:grid-cols-1">
            <UserAttendanceSummary userId={profile.id} />
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>Documents</CardTitle>
              {canEdit && (
                <>
                  <Button onClick={handleUploadClick} size="sm" className="w-full sm:w-auto">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif"
                  />
                </>
              )}
            </CardHeader>
            <CardContent>
              <UserDocumentList userId={profile.id} canEdit={canEdit} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="mt-6">
          <UserProfileProjects projects={projects} />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-6">
          <UserProfileTasks tasks={tasks} />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          <UserProfileActivity activities={activities} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
