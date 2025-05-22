/**
 * Consolidated Date Utilities
 *
 * This file provides a unified set of date utility functions for the entire application.
 * It combines functionality from:
 * - date-utils.ts
 * - attendance-date-utils.ts
 * - date-conversion.ts
 */

import {
  format,
  parseISO,
  isValid,
  parse,
  isWeekend,
  startOfDay,
  endOfDay,
  addMinutes,
  setHours,
  setMinutes,
} from 'date-fns';
import { GRACE_PERIODS, WORK_DAY, DATE_FORMATS } from '@/lib/constants/attendance';

// ==============================
// Core Date Utilities
// ==============================

/**
 * Type guard to check if a value is a valid Date object
 */
export function isValidDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Safely converts any date-like value to a Date object
 */
export function ensureDate(date: Date | string | null | undefined): Date | null {
  if (!date) {
    return null;
  }

  try {
    // If it's already a Date object, validate it
    if (date instanceof Date) {
      return isValidDate(date) ? date : null;
    }

    // If it's a string, try to parse it
    if (typeof date === 'string') {
      // Try ISO format first (most reliable)
      try {
        const parsed = parseISO(date);
        return isValidDate(parsed) ? parsed : null;
      } catch {
        // Fall back to regular Date constructor
        const parsed = new Date(date);
        return isValidDate(parsed) ? parsed : null;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Safely parses an ISO date string to a Date object
 */
export function safeParseISO(dateString: string): Date {
  try {
    if (!dateString) return new Date();

    const parsedDate = parseISO(dateString);

    // Check if the date is valid
    if (isNaN(parsedDate.getTime())) {
      return new Date();
    }

    return parsedDate;
  } catch (error) {
    return new Date();
  }
}

// ==============================
// Date Formatting
// ==============================

/**
 * Format a date for display - handles all date types used in the application
 */
export function formatDate(
  date: Date | string | null | undefined,
  formatString = 'MMM d, yyyy',
  fallback = 'Not available'
): string {
  // Handle null and undefined
  if (date === null || date === undefined) {
    return fallback;
  }

  const dateObj = ensureDate(date);

  if (!dateObj) {
    return fallback;
  }

  try {
    return format(dateObj, formatString);
  } catch (error) {
    return fallback;
  }
}

/**
 * Safe format function that handles all date types and provides fallbacks
 * This is the recommended function to use throughout the application
 */
export function safeFormat(
  date: Date | string | null | undefined,
  formatString = 'MMM d, yyyy',
  fallback = 'Not set'
): string {
  return formatDate(date, formatString, fallback);
}

/**
 * Format a date for HTML date input (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  const dateObj = ensureDate(date);

  if (!dateObj) {
    return '';
  }

  try {
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    return '';
  }
}

/**
 * Format a date for HTML datetime-local input (YYYY-MM-DDThh:mm)
 */
export function formatDateTimeForInput(date: Date | string | null | undefined): string {
  const dateObj = ensureDate(date);

  if (!dateObj) {
    return '';
  }

  try {
    return format(dateObj, "yyyy-MM-dd'T'HH:mm");
  } catch (error) {
    return '';
  }
}

/**
 * Formats time from a date object
 */
export function formatTime(date: Date): string {
  return format(date, DATE_FORMATS.DISPLAY_TIME);
}

/**
 * Formats a date for a specific input type
 */
export function formatForInputType(
  date: Date | string | null | undefined,
  inputType: 'date' | 'datetime-local' | 'time' = 'date'
): string {
  const validDate = ensureDate(date);
  if (!validDate) return '';

  switch (inputType) {
    case 'date':
      return validDate.toISOString().split('T')[0];
    case 'datetime-local':
      return validDate.toISOString().slice(0, 16);
    case 'time':
      return validDate.toISOString().split('T')[1].slice(0, 5);
    default:
      return '';
  }
}

/**
 * Creates URL parameters for date range queries
 */
export function formatDateRangeParams(startDate: string, endDate: string): string {
  const params = new URLSearchParams();
  params.set('startDate', startDate);
  params.set('endDate', endDate);
  return params.toString();
}

// ==============================
// Date Conversion
// ==============================

/**
 * Convert a string or Date to a Date object
 */
export function toDate(date: Date | string | null | undefined): Date | null {
  return ensureDate(date);
}

/**
 * Converts a Date object to an ISO string for API requests
 */
export function dateToApiFormat(date: Date | string | null | undefined): string | null {
  const validDate = ensureDate(date);
  return validDate ? validDate.toISOString() : null;
}

/**
 * Converts a date from any format to a consistent format for API requests
 */
export function prepareApiDates<T extends Record<string, any>>(obj: T, dateFields: (keyof T)[]): T {
  const result = { ...obj } as T;

  for (const field of dateFields) {
    if (field in result && result[field] !== undefined && result[field] !== null) {
      const dateValue = ensureDate(result[field]);
      // Use type assertion to fix the type error
      (result[field] as any) = dateValue ? dateValue.toISOString() : null;
    }
  }

  return result;
}

/**
 * Converts dates in an API response to Date objects
 */
export function processApiDates<T extends Record<string, any>>(obj: T, dateFields: (keyof T)[]): T {
  const result = { ...obj } as T;

  for (const field of dateFields) {
    if (field in result && typeof result[field] === 'string') {
      try {
        const date = new Date(result[field]);
        if (isValidDate(date)) {
          // Use type assertion to fix the type error
          (result[field] as any) = date;
        }
      } catch (error) {
        // Silently continue if date conversion fails
      }
    }
  }

  return result;
}

/**
 * Processes an array of objects, converting date strings to Date objects
 */
export function processApiDatesList<T extends Record<string, any>>(
  items: T[],
  dateFields: (keyof T)[]
): T[] {
  return items.map(item => processApiDates(item, dateFields));
}

// ==============================
// Duration Calculations
// ==============================

/**
 * Calculate duration between two dates/times
 */
export function calculateDuration(
  checkIn: Date | string,
  checkOut: Date | string | null | undefined
): string {
  if (!checkOut) return 'In progress';

  const start = ensureDate(checkIn);
  const end = ensureDate(checkOut);

  if (!start || !end) {
    return 'Invalid time';
  }

  try {
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return '0h 0m';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  } catch (error) {
    return 'Error';
  }
}

/**
 * Calculate hours between two dates/times
 */
export function calculateHours(
  checkIn: Date | string,
  checkOut: Date | string | null | undefined
): number | null {
  if (!checkOut) return null;

  const start = ensureDate(checkIn);
  const end = ensureDate(checkOut);

  if (!start || !end) {
    return null;
  }

  try {
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return 0;

    // Convert to hours with 2 decimal precision
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  } catch (error) {
    return null;
  }
}

// ==============================
// Attendance-Specific Utilities
// ==============================

/**
 * Gets the start time of the workday for a specific date
 */
export function getWorkdayStart(date: Date): Date {
  return setMinutes(setHours(new Date(date), WORK_DAY.START_HOUR), WORK_DAY.START_MINUTE);
}

/**
 * Gets the end time of the workday for a specific date
 */
export function getWorkdayEnd(date: Date): Date {
  return setMinutes(setHours(new Date(date), WORK_DAY.END_HOUR), WORK_DAY.END_MINUTE);
}

/**
 * Gets the late threshold time for a specific date
 */
export function getLateThreshold(date: Date): Date {
  const workdayStart = getWorkdayStart(date);
  return addMinutes(workdayStart, GRACE_PERIODS.LATE_ARRIVAL);
}

/**
 * Checks if a check-in time is considered late based on configured thresholds
 */
export function isLateCheckIn(checkInTime: Date): boolean {
  const lateThreshold = getLateThreshold(checkInTime);
  return checkInTime > lateThreshold;
}

/**
 * Gets the beginning and end of a day for database queries
 */
export function getDayBoundaries(date: Date): { start: Date; end: Date } {
  return {
    start: startOfDay(date),
    end: endOfDay(date),
  };
}

/**
 * Checks if a date is a weekend
 */
export function isWeekendDay(date: Date): boolean {
  return WORK_DAY.WEEKEND_DAYS.includes(date.getDay());
}

/**
 * Calculates work duration in hours
 */
export function calculateWorkHours(checkInTime: Date, checkOutTime: Date): number {
  const durationMs = checkOutTime.getTime() - checkInTime.getTime();
  return Math.max(0, durationMs / (60 * 60 * 1000)); // Convert ms to hours
}

/**
 * Calculates total work hours with business rules applied
 */
export function calculateTotalHours(
  checkInTime: Date,
  checkOutTime: Date,
  options: {
    maxHoursPerDay?: number;
    applyWorkdayBounds?: boolean;
    isAutoCheckout?: boolean;
  } = {}
): number {
  // Set default options
  const {
    maxHoursPerDay = WORK_DAY.MAX_HOURS_PER_DAY,
    applyWorkdayBounds = true,
    isAutoCheckout = false,
  } = options;

  // Ensure we're working with Date objects
  const startTime = new Date(checkInTime);
  const endTime = new Date(checkOutTime);

  // Basic validation
  if (startTime >= endTime) {
    return 0; // Invalid time range
  }

  let effectiveEndTime = new Date(endTime);

  // If applying workday bounds and this is an auto-checkout
  if (applyWorkdayBounds && isAutoCheckout) {
    // For auto-checkout, if the check-in was before the workday start,
    // use workday start as the effective check-in time
    const workdayStart = getWorkdayStart(startTime);
    const workdayEnd = getWorkdayEnd(startTime);

    // If checkout time is after workday end, cap it at workday end
    if (endTime > workdayEnd) {
      effectiveEndTime = workdayEnd;
    }

    // If the duration exceeds the standard workday hours, cap it
    const standardWorkdayMs = WORK_DAY.HOURS_PER_DAY * 60 * 60 * 1000;
    const actualDurationMs = effectiveEndTime.getTime() - startTime.getTime();

    if (actualDurationMs > standardWorkdayMs) {
      // For auto-checkout, default to standard workday hours
      return WORK_DAY.HOURS_PER_DAY;
    }
  }

  // Calculate duration in milliseconds
  const durationMs = effectiveEndTime.getTime() - startTime.getTime();

  // Convert to hours (decimal)
  const hours = durationMs / (1000 * 60 * 60);

  // Apply maximum hours constraint
  const cappedHours = Math.min(hours, maxHoursPerDay);

  // Return with 2 decimal precision
  return Math.round(cappedHours * 100) / 100;
}

/**
 * Calculates work duration as percentage of standard workday
 */
export function calculateWorkPercentage(checkInTime: Date, checkOutTime: Date): number {
  const durationMs = checkOutTime.getTime() - checkInTime.getTime();
  return Math.min(100, Math.round((durationMs / WORK_DAY.WORKING_HOURS_MS) * 100));
}

/**
 * Determines if a given time is within standard work hours
 */
export function isWithinWorkHours(date: Date): boolean {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Convert to total minutes for easier comparison
  const timeInMinutes = hours * 60 + minutes;
  const startInMinutes = WORK_DAY.START_HOUR * 60 + WORK_DAY.START_MINUTE;
  const endInMinutes = WORK_DAY.END_HOUR * 60 + WORK_DAY.END_MINUTE;

  return timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes;
}

/**
 * Determines if a given day is a work day based on default work days
 */
export function isWorkDay(date: Date): boolean {
  const day = date.getDay();
  // Check if the day is not in the weekend days array
  return !WORK_DAY.WEEKEND_DAYS.includes(day);
}

// ==============================
// Legacy Compatibility Functions
// ==============================

/**
 * @deprecated Use formatDate instead
 * Legacy compatibility function with the same signature as the old formatDate
 */
export function formatDateLegacy(date: string | null, formatString = 'MMM d, yyyy'): string {
  return formatDate(date, formatString);
}
