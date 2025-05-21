import useSWR from 'swr';
import { useState } from 'react';
import { userApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { UserWithProfile } from '@/types/user';

export type UserProfile = UserWithProfile;

export type UserProfileData = {
  user: UserWithProfile;
  projects: Array<{
    id: string;
    title: string;
    statusId?: string;
    status?: {
      id: string;
      name: string;
      color: string;
      description?: string | null;
      isDefault: boolean;
    };
    startDate?: string | null;
    endDate?: string | null;
    role?: string;
    joinedAt?: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    priority: string;
    dueDate?: string | null;
    project?: {
      id: string;
      title: string;
    };
  }>;
  activities: Array<{
    id: string;
    action: string;
    entityType: string;
    description?: string | null;
    createdAt: string;
    project?: {
      id: string;
      title: string;
    } | null;
    task?: {
      id: string;
      title: string;
    } | null;
  }>;
  teamMemberships?: Array<{
    id: string;
    projectId: string;
    projectTitle: string;
    projectStatus?: {
      id: string;
      name: string;
      color: string;
    } | null;
    joinedAt: string;
  }>;
  stats: {
    projectCount: number;
    taskCount: number;
    teamCount: number;
    completionRate: string;
  };
};

const DEFAULT_STATS = {
  projectCount: 0,
  taskCount: 0,
  teamCount: 0,
  completionRate: '0%',
};

export function useUserProfile(userId: string, initialUser?: UserProfile) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // Create a proper fallback with the right structure
  const fallbackData = initialUser
    ? {
        user: initialUser,
        projects: [],
        tasks: [],
        activities: [],
        stats: DEFAULT_STATS,
      }
    : undefined;

  const { data, error, isLoading, mutate } = useSWR<UserProfileData>(
    userId ? `/api/users/${userId}?profile=true` : null,
    async () => {
      try {
        console.log('Fetching user profile for:', userId);
        const response = await userApi.getUserProfile(userId);
        console.log('User profile response:', response);

        if (!response) {
          throw new Error('No profile data received');
        }

        // Handle different response formats safely
        let userData: UserProfile;
        let projectsData: any[] = [];
        let tasksData: any[] = [];
        let activitiesData: any[] = [];
        let statsData = { ...DEFAULT_STATS };

        // Case 1: Response has already the expected structure with 'user' property
        if (response.user && typeof response.user === 'object') {
          userData = response.user as UserProfile;
          projectsData = Array.isArray(response.projects) ? response.projects : [];
          tasksData = Array.isArray(response.tasks) ? response.tasks : [];
          activitiesData = Array.isArray(response.activities) ? response.activities : [];
          statsData = response.stats || DEFAULT_STATS;
          const teamMembershipsData = Array.isArray(response.teamMemberships)
            ? response.teamMemberships
            : [];
        }
        // Case 2: Response is the user object itself with projects, tasks as properties
        else if (response.id) {
          // Extract user data from the response
          const { projects, tasks, activities, stats, teamMemberships, ...userObject } = response;

          userData = userObject as UserProfile;
          projectsData = Array.isArray(projects) ? projects : [];
          tasksData = Array.isArray(tasks) ? tasks : [];
          activitiesData = Array.isArray(activities) ? activities : [];
          statsData = stats || DEFAULT_STATS;
          const teamMembershipsData = Array.isArray(teamMemberships) ? teamMemberships : [];
        }
        // Case 3: Unexpected response format
        else {
          console.error('Invalid profile data structure:', response);
          throw new Error('Invalid profile data structure');
        }

        // Safety check: Ensure required fields exist
        if (!userData.id) userData.id = userId;

        // Define teamMembershipsData in the outer scope
        let teamMembershipsData: any[] = [];

        // Check if teamMemberships exists in the response
        if (Array.isArray(response.teamMemberships)) {
          teamMembershipsData = response.teamMemberships;
        }

        return {
          user: userData,
          projects: projectsData,
          tasks: tasksData,
          activities: activitiesData,
          teamMemberships: teamMembershipsData,
          stats: statsData,
        };
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user profile. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      errorRetryCount: 2,
      fallbackData,
    }
  );

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!userId) return;

    setIsUpdating(true);
    try {
      await userApi.updateUserProfile(userId, profileData);
      await mutate();
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const uploadProfileImage = async (file: File) => {
    if (!userId) return null;

    setIsUpdating(true);
    try {
      const response = await userApi.uploadProfileImage(userId, file);
      if (response && response.image) {
        await mutate();
        return response.image;
      }
      return null;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload profile image. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    profile: data?.user,
    projects: data?.projects || [],
    tasks: data?.tasks || [],
    activities: data?.activities || [],
    teamMemberships: data?.teamMemberships || [],
    stats: data?.stats || DEFAULT_STATS,
    isLoading,
    isError: error,
    isUpdating,
    updateProfile,
    uploadProfileImage,
    mutate,
  };
}
