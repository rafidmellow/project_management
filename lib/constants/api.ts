/**
 * API Constants
 *
 * This file contains constants related to API responses, error codes, and other API-related values.
 */

/**
 * Standard API error codes
 */
export const API_ERROR_CODES = {
  // Standard HTTP error codes
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500,

  // Custom application error codes
  VALIDATION_ERROR: 400,
  AUTHENTICATION_ERROR: 401,
  PERMISSION_ERROR: 403,
  RESOURCE_NOT_FOUND: 404,
  DUPLICATE_RESOURCE: 409,

  // Attendance specific error codes
  ALREADY_CHECKED_IN: 400,
  ALREADY_CHECKED_OUT: 400,
  NO_ACTIVE_ATTENDANCE: 404,

  // Project specific error codes
  PROJECT_NOT_FOUND: 404,
  PROJECT_ACCESS_DENIED: 403,

  // Task specific error codes
  TASK_NOT_FOUND: 404,
  TASK_ACCESS_DENIED: 403,

  // User specific error codes
  USER_NOT_FOUND: 404,
  USER_EXISTS: 409,
  INVALID_CREDENTIALS: 401,
};

/**
 * API response status codes
 */
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
};

/**
 * API pagination defaults
 */
export const API_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

/**
 * API request methods
 */
export const API_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

/**
 * API content types
 */
export const API_CONTENT_TYPES = {
  JSON: 'application/json',
  FORM: 'application/x-www-form-urlencoded',
  MULTIPART: 'multipart/form-data',
};
