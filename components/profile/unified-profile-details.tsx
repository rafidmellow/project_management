'use client';

import { useState } from 'react';
import { Edit, Save, X, User, Briefcase, MapPin, Phone, Building, FileText } from 'lucide-react';
import { UserProfile } from '@/hooks/use-user-profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface ProfileDetailsProps {
  profile: UserProfile;
  canEdit: boolean;
  isLoading?: boolean;
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

export function UnifiedProfileDetails({
  profile,
  canEdit,
  isLoading = false,
  onUpdateProfile,
}: ProfileDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    bio: profile.bio || '',
    jobTitle: profile.jobTitle || '',
    department: profile.department || '',
    location: profile.location || '',
    phone: profile.phone || '',
    skills:
      typeof profile.skills === 'string'
        ? profile.skills
        : Array.isArray(profile.skills)
          ? profile.skills.join(', ')
          : '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onUpdateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile details:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      bio: profile.bio || '',
      jobTitle: profile.jobTitle || '',
      department: profile.department || '',
      location: profile.location || '',
      phone: profile.phone || '',
      skills:
        typeof profile.skills === 'string'
          ? profile.skills
          : Array.isArray(profile.skills)
            ? profile.skills.join(', ')
            : '',
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return <ProfileDetailsSkeleton />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Profile Details</CardTitle>
        {canEdit && !isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
        {isEditing && (
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself"
                className="resize-none"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  placeholder="Your job title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="Your department"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Your location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Your phone number"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma separated)</Label>
              <Input
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                placeholder="Your skills, separated by commas"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Bio
              </h3>
              <p className="text-sm text-muted-foreground">
                {profile.bio || 'No bio information available.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Job Title
                </h3>
                <p className="text-sm text-muted-foreground">
                  {profile.jobTitle || 'Not specified'}
                </p>
              </div>

              <div>
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  Department
                </h3>
                <p className="text-sm text-muted-foreground">
                  {profile.department || 'Not specified'}
                </p>
              </div>

              <div>
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Location
                </h3>
                <p className="text-sm text-muted-foreground">
                  {profile.location || 'Not specified'}
                </p>
              </div>

              <div>
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Phone
                </h3>
                <p className="text-sm text-muted-foreground">{profile.phone || 'Not specified'}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Skills
              </h3>
              <p className="text-sm text-muted-foreground">
                {typeof profile.skills === 'string'
                  ? profile.skills
                  : Array.isArray(profile.skills)
                    ? profile.skills.join(', ')
                    : 'No skills specified'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProfileDetailsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-24" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mt-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i}>
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>

          <div>
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
