'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to apply max-width constraints based on breakpoints
   * @default true
   */
  constrained?: boolean;

  /**
   * Whether to center the container horizontally
   * @default true
   */
  centered?: boolean;
}

/**
 * Container component that provides consistent max-width constraints and centering
 * across different breakpoints.
 */
export function Container({
  className,
  constrained = true,
  centered = true,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        // Base styles
        'w-full',
        // Conditional max-width constraints
        constrained &&
          'max-w-[100%] xs:max-w-[540px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[960px] xl:max-w-[1140px] 2xl:max-w-[1320px]',
        // Conditional centering
        centered && 'mx-auto',
        className
      )}
      {...props}
    />
  );
}
