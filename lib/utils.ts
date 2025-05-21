import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Re-export all date utility functions
export * from './utils/date';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
