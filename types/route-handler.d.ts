import { NextRequest } from 'next/server';

declare module 'next/server' {
  export interface RouteHandlerContext {
    params: Record<string, string>;
  }

  export type RouteHandler<T = any> = (
    req: NextRequest,
    context: RouteHandlerContext
  ) => Response | Promise<Response>;
}
