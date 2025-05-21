/**
 * User Management Types
 *
 * This file contains all type definitions related to users in the application.
 * Following Next.js 15 documentation standards for type definitions.
 */

/**
 * Base User interface representing the core user data
 */
export interface User {
  id: string;
  name?: string | null;
  email: string;
  emailVerified?: string | Date | null;
  image?: string | null;
  password?: string | null;
  role: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  lastLogin?: string | Date | null;
  active: boolean;
}

/**
 * Extended User interface with profile information
 */
export interface UserWithProfile extends User {
  bio?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  location?: string | null;
  phone?: string | null;
  skills?: string | null | string[]; // Support both string and string[] for compatibility
}

/**
 * User with related entities
 */
export interface UserWithRelations extends UserWithProfile {
  projects?: import('./project').Project[];
  teams?: import('./project').TeamMember[];
  taskAssignments?: import('./task').TaskAssignee[];
  attendanceRecords?: import('./attendance').Attendance[];
  _count?: {
    projects?: number;
    teams?: number;
    taskAssignments?: number;
    attendanceRecords?: number;
  };
}

/**
 * User Summary interface for simplified user representation
 */
export interface UserSummary {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role?: string;
}

/**
 * User Creation DTO
 */
export interface CreateUserDTO {
  name: string;
  email: string;
  password?: string;
  image?: string;
  role?: string;
  bio?: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  phone?: string;
  skills?: string[];
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
}

/**
 * User Update DTO
 */
export interface UpdateUserDTO extends Partial<CreateUserDTO> {}

/**
 * User Filter Options
 */
export interface UserFilterOptions {
  search?: string;
  role?: string;
  active?: boolean;
  projectId?: string;
  sortBy?: 'name' | 'email' | 'role' | 'createdAt' | 'lastLogin';
  sortDirection?: 'asc' | 'desc';
}

/**
 * User API Response
 */
export interface UserResponse {
  user: UserWithProfile;
}

/**
 * Users List API Response
 */
export interface UsersListResponse {
  users: UserWithProfile[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * User Authentication Result
 */
export interface AuthResult {
  user: UserSummary;
  token?: string;
  expiresAt?: number;
}

/**
 * Login Credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

/**
 * Registration Data
 */
export interface RegistrationData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

/**
 * Password Reset Request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password Reset Confirmation
 */
export interface PasswordResetConfirmation {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * User Account
 */
export interface UserAccount {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
}

/**
 * User Session
 */
export interface UserSession {
  id: string;
  sessionToken: string;
  userId: string;
  expires: string | Date;
}

/**
 * Verification Token
 */
export interface VerificationToken {
  identifier: string;
  token: string;
  expires: string | Date;
}
