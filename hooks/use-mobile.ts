'use client';

import { useBreakpoints } from './use-breakpoints';

/**
 * Legacy hook for backward compatibility
 *
 * @deprecated This hook is maintained only for backward compatibility.
 * Please use `useBreakpoints().isMobile` for new code.
 *
 * Example:
 * ```tsx
 * // Instead of:
 * const isMobile = useIsMobile();
 *
 * // Use:
 * const { isMobile } = useBreakpoints();
 * ```
 *
 * The useBreakpoints hook provides additional breakpoint information
 * beyond just mobile detection, including xs, sm, md, lg, xl, and 2xl.
 */
export function useIsMobile() {
  const { isMobile } = useBreakpoints();
  return isMobile;
}
