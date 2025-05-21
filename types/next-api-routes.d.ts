// Custom type declarations for Next.js API route parameters
// This file helps resolve type conflicts in dynamic route parameters in App Router

import { NextRequest } from 'next/server';

// Interface that accommodates both Promise-based and direct params
interface RouteParams<T = any> {
  params: T | Promise<T>;
}

// Type for single parameter API routes
export type ApiRouteHandlerOneParam<T extends string> = (
  req: NextRequest,
  context: RouteParams<{ [key in T]: string }>
) => Promise<Response>;

// Type for two parameter API routes
export type ApiRouteHandlerTwoParams<T extends string, U extends string> = (
  req: NextRequest,
  context: RouteParams<{ [key in T]: string } & { [key in U]: string }>
) => Promise<Response>;

// Helper function to safely extract params regardless of whether they're a Promise
export async function getParams<T>(params: T | Promise<T>): Promise<T> {
  return params instanceof Promise ? await params : params;
}
