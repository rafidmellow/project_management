// Use the generated Prisma client from the custom path
import { PrismaClient, Prisma } from '../prisma/generated/client';

// Add prisma to the global type
declare global {
  var prisma: PrismaClient | undefined;
}

// Check if we're running on the server or in the browser
const isServer = typeof window === 'undefined';

// Only instantiate PrismaClient on the server
let prisma: PrismaClient;

if (isServer) {
  // PrismaClient is attached to the `global` object in development to prevent
  // exhausting your database connection limit.
  // Learn more: https://pris.ly/d/help/next-js-best-practices

  // Configure Prisma Client options
  const prismaClientOptions: Prisma.PrismaClientOptions = {
    log:
      process.env.NODE_ENV === 'development'
        ? (['query', 'error', 'warn'] as Prisma.LogLevel[])
        : (['error'] as Prisma.LogLevel[]),
    errorFormat: 'pretty',
  };

  // If prisma client exists on global object, use it, otherwise create a new instance
  prisma = global.prisma || new PrismaClient(prismaClientOptions);

  // In development, save client to global object to prevent multiple instances
  if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
  }

  // Add error handling
  prisma.$use(async (params, next) => {
    try {
      return await next(params);
    } catch (error) {
      // Log database errors with operation details
      console.error(`Database error in ${params.model}.${params.action}:`, {
        error,
        params: {
          model: params.model,
          action: params.action,
          args: params.args,
        },
      });

      // Re-throw the error to be handled by the API route
      throw error;
    }
  });
} else {
  // In the browser, provide a dummy object that throws an error when used
  prisma = new Proxy({} as PrismaClient, {
    get(target, prop) {
      if (prop === 'then') {
        // Special case for promise resolution
        return undefined;
      }
      throw new Error(
        'PrismaClient is unable to run in this browser environment, or has been bundled for the browser. ' +
          'If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report'
      );
    },
  });
}

export default prisma;
