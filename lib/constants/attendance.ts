/**
 * Centralized constants for the attendance system
 * This file contains all the configuration settings and constants used across
 * the attendance tracking features of the application.
 */

export const WORK_DAY = {
  // Standard working hours (9:00 AM - 5:00 PM)
  START_HOUR: 9,
  START_MINUTE: 0,
  END_HOUR: 17, // 5 PM in 24-hour format
  END_MINUTE: 0,
  // Weekend days (0 = Sunday, 6 = Saturday)
  WEEKEND_DAYS: [0, 6],
  // Working hours in milliseconds for calculating percentage
  WORKING_HOURS_MS: 8 * 60 * 60 * 1000,
  // Total work hours per day
  HOURS_PER_DAY: 8,
  // Maximum allowed working hours per day (to prevent unrealistic values)
  MAX_HOURS_PER_DAY: 12,
  // Default checkout time in hours (for auto-checkout)
  DEFAULT_CHECKOUT_HOURS: 8,
};

export const GRACE_PERIODS = {
  // Grace period for late arrivals (in minutes)
  LATE_ARRIVAL: 15,
  // Grace period for early departures (in minutes)
  EARLY_DEPARTURE: 15,
  // Auto-checkout period (in hours after workday end)
  AUTO_CHECKOUT: 2,
  // Location accuracy threshold (in meters)
  LOCATION: 100,
};

export const STATUS_COLORS = {
  PRESENT: 'green',
  ABSENT: 'red',
  LATE: 'amber',
  PARTIAL: 'blue',
  WEEKEND: 'slate',
  HOLIDAY: 'purple',
};

// Attendance status thresholds

export const THRESHOLDS = {
  // Number of late arrivals that constitutes a pattern
  PATTERN_COUNT: 3,
  // Minimum hours that constitute a valid work day (as percentage of standard day)
  VALID_DAY_PERCENT: 80,
  // Minimum hours for partial day
  PARTIAL_DAY_HOURS: 4,
};

export const DATE_FORMATS = {
  // Format for API date parameters (YYYY-MM-DD)
  API_DATE: 'yyyy-MM-dd',
  // Format for display date (Month D, YYYY)
  DISPLAY_DATE: 'MMM d, yyyy',
  // Format for displaying time (h:mm a)
  DISPLAY_TIME: 'h:mm a',
  // Format for database timestamps
  DB_TIMESTAMP: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
};

export const DASHBOARD_DEFAULTS = {
  // Default time range for dashboard charts (in days)
  TIME_RANGE: 30,
  // Default pagination limit for API requests
  PAGINATION_LIMIT: 50,
  // Number of days to show in calendar view
  CALENDAR_DAYS: 31,
  // Default chart height in pixels
  CHART_HEIGHT: 300,
};

export const API_ERROR_CODES = {
  // Consistent error codes for attendance-related API responses
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  ALREADY_CHECKED_IN: 400,
  ALREADY_CHECKED_OUT: 400,
  MISSING_RECORD: 404,
  SERVER_ERROR: 500,
};

export const ACTION_TYPES = {
  // Attendance action types for activity logging
  CHECK_IN: 'checked-in',
  CHECK_OUT: 'checked-out',
  AUTO_CHECKOUT: 'auto-checkout',
};
