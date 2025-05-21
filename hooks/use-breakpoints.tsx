'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Define breakpoint values based on Tailwind configuration
const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Define the shape of our breakpoints state
export interface BreakpointState {
  isXs: boolean; // < 480px
  isSm: boolean; // >= 480px and < 640px
  isMd: boolean; // >= 640px and < 768px
  isLg: boolean; // >= 768px and < 1024px
  isXl: boolean; // >= 1024px and < 1280px
  is2xl: boolean; // >= 1280px
  isMobile: boolean; // < 768px (md)
  // Helper functions
  isAtLeast: (breakpoint: keyof typeof BREAKPOINTS) => boolean;
  isAtMost: (breakpoint: keyof typeof BREAKPOINTS) => boolean;
  current: keyof typeof BREAKPOINTS | null;
}

// Create a context for breakpoints
const BreakpointsContext = createContext<BreakpointState | undefined>(undefined);

/**
 * Hook to access breakpoint information
 * @returns Breakpoint state with boolean flags for each breakpoint
 */
export function useBreakpoints(): BreakpointState {
  const context = useContext(BreakpointsContext);

  if (context === undefined) {
    // Create a default context for server-side rendering
    const defaultIsAtLeast = (breakpoint: keyof typeof BREAKPOINTS) => false;
    const defaultIsAtMost = (breakpoint: keyof typeof BREAKPOINTS) => false;

    // Return default values when used outside provider (e.g., during SSR)
    return {
      isXs: false,
      isSm: false,
      isMd: false,
      isLg: false,
      isXl: false,
      is2xl: false,
      isMobile: false,
      isAtLeast: defaultIsAtLeast,
      isAtMost: defaultIsAtMost,
      current: null,
    };
  }

  return context;
}

/**
 * Provider component for breakpoint information
 */
export function BreakpointsProvider({ children }: { children: ReactNode }) {
  // Create default helper functions that work on server-side
  const defaultIsAtLeast = (breakpoint: keyof typeof BREAKPOINTS) => false;
  const defaultIsAtMost = (breakpoint: keyof typeof BREAKPOINTS) => false;

  // Initialize with default values (will be updated in useEffect)
  const [breakpoints, setBreakpoints] = useState<BreakpointState>({
    isXs: false,
    isSm: false,
    isMd: false,
    isLg: false,
    isXl: false,
    is2xl: false,
    isMobile: false,
    isAtLeast: defaultIsAtLeast,
    isAtMost: defaultIsAtMost,
    current: null,
  });

  // Track if we're in the browser
  const [isBrowser, setIsBrowser] = useState(false);

  // Set isBrowser to true once component mounts
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  useEffect(() => {
    // Only run in browser environment
    if (!isBrowser) return;

    // Function to determine current breakpoint
    const getCurrentBreakpoint = (width: number): keyof typeof BREAKPOINTS | null => {
      if (width < BREAKPOINTS.xs) return 'xs';
      if (width < BREAKPOINTS.sm) return 'xs';
      if (width < BREAKPOINTS.md) return 'sm';
      if (width < BREAKPOINTS.lg) return 'md';
      if (width < BREAKPOINTS.xl) return 'lg';
      if (width < BREAKPOINTS['2xl']) return 'xl';
      // Explicitly check for 2xl breakpoint (1536px and above)
      return '2xl';
    };

    // Function to update breakpoints based on window width
    const updateBreakpoints = () => {
      const width = window.innerWidth;
      const current = getCurrentBreakpoint(width);

      // Helper functions
      const isAtLeast = (breakpoint: keyof typeof BREAKPOINTS) => {
        return width >= BREAKPOINTS[breakpoint];
      };

      const isAtMost = (breakpoint: keyof typeof BREAKPOINTS) => {
        return width < BREAKPOINTS[breakpoint === 'xs' ? 'sm' : breakpoint];
      };

      // Ensure 2xl breakpoint is correctly detected
      const is2xlBreakpoint = width >= BREAKPOINTS['2xl'];

      setBreakpoints({
        isXs: width < BREAKPOINTS.xs || (width >= BREAKPOINTS.xs && width < BREAKPOINTS.sm),
        isSm: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md,
        isMd: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
        isLg: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl,
        isXl: width >= BREAKPOINTS.xl && width < BREAKPOINTS['2xl'],
        is2xl: is2xlBreakpoint,
        isMobile: width < BREAKPOINTS.md,
        isAtLeast,
        isAtMost,
        current,
      });
    };

    // Initial check
    updateBreakpoints();

    // Add event listener
    window.addEventListener('resize', updateBreakpoints);

    // Cleanup
    return () => window.removeEventListener('resize', updateBreakpoints);
  }, [isBrowser]);

  return <BreakpointsContext.Provider value={breakpoints}>{children}</BreakpointsContext.Provider>;
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useBreakpoints().isMobile instead
 */
export function useIsMobile() {
  const { isMobile } = useBreakpoints();
  return isMobile;
}

// Create a client-only version of the provider that only renders on the client
import dynamic from 'next/dynamic';

export const ClientBreakpointsProvider = dynamic(
  () =>
    Promise.resolve(({ children }: { children: ReactNode }) => (
      <BreakpointsProvider>{children}</BreakpointsProvider>
    )),
  { ssr: false }
);
