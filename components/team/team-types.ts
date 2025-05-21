/**
 * Type definitions for team-related components
 */

export interface User {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  role?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  projectId: string;
  user?: User;
  project?: Project;
  createdAt?: string | Date;
}

export interface TeamMemberWithProjects extends TeamMember {
  projects: Project[];
}

export interface TeamMembersFilters {
  search: string;
  projectId: string | null;
}

export interface DeleteConfirmation {
  id: string;
  name: string | null;
  email: string;
}
