// lib/edge-prisma.ts
// Edge-compatible Prisma client for middleware and edge functions

import { PrismaClient } from '../prisma/generated/client/edge';

// Create a new PrismaClient instance for edge environments
// This will use the edge runtime compatible version of Prisma
let prisma: PrismaClient;

try {
  prisma = new PrismaClient({
    // Configure minimal logging for edge environments
    log: ['error'],
  });
} catch (error) {
  // Provide a dummy client that handles errors instead of crashing
  prisma = new Proxy({} as PrismaClient, {
    get(target, prop) {
      if (prop === 'then') {
        // Special case for promise resolution
        return undefined;
      }

      // Return a function that rejects with an error
      return () => {
        return Promise.reject(new Error('Edge PrismaClient not available'));
      };
    },
  });
}

export default prisma;
