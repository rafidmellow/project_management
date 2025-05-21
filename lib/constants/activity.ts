/**
 * Activity Constants
 *
 * This file contains constants related to activity logging in the application.
 */

/**
 * Action types for activity logging
 */
export const ACTION_TYPES = {
  // User actions
  LOGIN: 'logged-in',
  LOGOUT: 'logged-out',
  PROFILE_UPDATE: 'profile-updated',
  PASSWORD_CHANGE: 'password-changed',

  // Project actions
  PROJECT_CREATE: 'project-created',
  PROJECT_UPDATE: 'project-updated',
  PROJECT_DELETE: 'project-deleted',
  PROJECT_STATUS_CHANGE: 'project-status-changed',
  PROJECT_MEMBER_ADD: 'project-member-added',
  PROJECT_MEMBER_REMOVE: 'project-member-removed',

  // Task actions
  TASK_CREATE: 'task-created',
  TASK_UPDATE: 'task-updated',
  TASK_DELETE: 'task-deleted',
  TASK_STATUS_CHANGE: 'task-status-changed',
  TASK_ASSIGN: 'task-assigned',
  TASK_UNASSIGN: 'task-unassigned',
  TASK_COMMENT: 'task-commented',

  // Subtask actions
  SUBTASK_CREATE: 'subtask-created',
  SUBTASK_UPDATE: 'subtask-updated',
  SUBTASK_DELETE: 'subtask-deleted',
  SUBTASK_COMPLETE: 'subtask-completed',

  // Attendance actions
  CHECK_IN: 'checked-in',
  CHECK_OUT: 'checked-out',
  AUTO_CHECKOUT: 'auto-checkout',
  ATTENDANCE_CORRECTION: 'attendance-corrected',

  // Admin actions
  USER_CREATE: 'user-created',
  USER_UPDATE: 'user-updated',
  USER_DELETE: 'user-deleted',
  ROLE_ASSIGN: 'role-assigned',
  PERMISSION_CHANGE: 'permission-changed',
  SYSTEM_SETTING_CHANGE: 'system-setting-changed',
};

/**
 * Entity types for activity logging
 */
export const ENTITY_TYPES = {
  USER: 'user',
  PROJECT: 'project',
  TASK: 'task',
  SUBTASK: 'subtask',
  COMMENT: 'comment',
  ATTENDANCE: 'attendance',
  ROLE: 'role',
  PERMISSION: 'permission',
  SETTING: 'setting',
};

/**
 * Activity visibility levels
 */
export const VISIBILITY_LEVELS = {
  SYSTEM: 'system', // Visible to admins only
  ADMIN: 'admin', // Visible to admins only
  PROJECT: 'project', // Visible to project members
  USER: 'user', // Visible to the user only
  PUBLIC: 'public', // Visible to all authenticated users
};
