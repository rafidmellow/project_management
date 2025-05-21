'use client';

import { useState, useRef } from 'react';
import { Camera, Edit, Mail, Calendar, Phone, MapPin, Building, Save, X } from 'lucide-react';
import { UserProfile } from '@/hooks/use-user-profile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { RoleBadge } from '@/components/ui/role-badge';

interface ProfileHeaderProps {
  user: UserProfile;
  canEdit: boolean;
  isOwnProfile: boolean;
  isLoading?: boolean;
  stats?: {
    projectCount: number;
    taskCount: number;
    teamCount: number;
    completionRate: string;
  };
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
  onUploadImage: (file: File) => Promise<string | null>;
}

export function UnifiedProfileHeader({
  user,
  canEdit,
  isOwnProfile,
  isLoading = false,
  stats = {
    projectCount: 0,
    taskCount: 0,
    teamCount: 0,
    completionRate: '0%',
  },
  onUpdateProfile,
  onUploadImage,
}: ProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState(user.name || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUserInitials = () => {
    if (!user.name) return 'U';

    const nameParts = user.name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }

    return nameParts[0].substring(0, 2).toUpperCase();
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setName(user.name || '');
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      await onUpdateProfile({ name });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleImageClick = () => {
    if (canEdit && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onUploadImage(file);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
      // Clear the input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Format dates in a more readable way
  const formattedCreatedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  if (isLoading) {
    return <ProfileHeaderSkeleton />;
  }

  return (
    <Card className="border shadow-sm overflow-hidden">
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/10 relative" />

      {/* Profile Content */}
      <CardContent className="relative px-6 pb-6 pt-0">
        {/* Avatar Section */}
        <div className="-mt-12 mb-4">
          <div className="relative inline-block">
            <Avatar
              className="h-24 w-24 border-4 border-background ring-1 ring-black/10 cursor-pointer shadow-md"
              onClick={handleImageClick}
            >
              {user.image ? <AvatarImage src={user.image} alt={user.name || 'User'} /> : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            {canEdit && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-sm">
                  <Camera className="h-4 w-4" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {isEditing ? (
              <div className="flex items-center gap-2 mb-2">
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="h-9 max-w-[250px]"
                  placeholder="Enter name"
                />
                <Button size="icon" variant="ghost" onClick={handleSave} className="h-8 w-8">
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleEditToggle} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{user.name || 'User'}</h2>
                {canEdit && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleEditToggle}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Joined {formattedCreatedDate}</span>
              </div>
            </div>
            {user.role && (
              <div className="mt-2">
                <RoleBadge role={user.role} />
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="rounded-xl border bg-card p-4 text-center shadow-xs">
            <div className="text-3xl font-bold text-primary">{stats.projectCount}</div>
            <div className="text-sm text-muted-foreground">Projects</div>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center shadow-xs">
            <div className="text-3xl font-bold text-primary">{stats.taskCount}</div>
            <div className="text-sm text-muted-foreground">Tasks</div>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center shadow-xs">
            <div className="text-3xl font-bold text-primary">{stats.teamCount}</div>
            <div className="text-sm text-muted-foreground">Teams</div>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center shadow-xs">
            <div className="text-3xl font-bold text-primary">{stats.completionRate}</div>
            <div className="text-sm text-muted-foreground">Completion</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileHeaderSkeleton() {
  return (
    <Card className="border shadow-sm overflow-hidden">
      <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/10" />
      <CardContent className="relative px-6 pb-6 pt-0">
        <div className="-mt-12 mb-4">
          <Skeleton className="h-24 w-24 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}
