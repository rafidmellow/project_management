/**
 * Utility functions for profile data handling
 */

/**
 * Safely fetches data from an API endpoint with consistent error handling
 */
export async function fetchProfileData<T>(
  endpoint: string,
  options?: RequestInit,
  defaultValue?: T
): Promise<{
  data: T | null;
  error: string | null;
}> {
  try {
    const response = await fetch(endpoint, options);

    if (!response.ok) {
      let errorMessage = `API returned status ${response.status}`;

      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If JSON parsing fails, use default error message
      }

      return {
        data: defaultValue || null,
        error: errorMessage,
      };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching profile data:', error);
    return {
      data: defaultValue || null,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

/**
 * Validates that an object has all required fields
 */
export function validateObject<T>(obj: any, requiredFields: string[]): obj is T {
  if (!obj || typeof obj !== 'object') return false;

  return requiredFields.every(field => {
    const fieldPath = field.split('.');
    let value = obj;

    for (const path of fieldPath) {
      if (value === undefined || value === null) return false;
      value = value[path];
    }

    return value !== undefined;
  });
}

/**
 * Safely formats a date string with fallback
 */
export function safeFormatDate(
  dateString: string | null | undefined,
  formatter: (date: Date) => string,
  fallback: string = 'N/A'
): string {
  if (!dateString) return fallback;

  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return fallback;
    return formatter(date);
  } catch (error) {
    console.error('Date formatting error:', error);
    return fallback;
  }
}

/**
 * Safe number formatter with fallback
 */
export function safeNumberFormat(
  value: number | string | null | undefined,
  options: {
    decimals?: number;
    fallback?: string;
    suffix?: string;
  } = {}
): string {
  const { decimals = 1, fallback = '0', suffix = '' } = options;

  if (value === null || value === undefined) return fallback;

  try {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return fallback;
    return `${num.toFixed(decimals)}${suffix}`;
  } catch (error) {
    return fallback;
  }
}
