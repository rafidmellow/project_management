// scripts/direct-build.js
// A minimal build script that avoids file watching issues
/* eslint-disable no-console */

import { execSync } from 'node:child_process';

console.log('Starting minimal build process...');

try {
  // Generate Prisma client
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', {
    stdio: 'inherit',
    env: {
      ...process.env,
      PRISMA_CLIENT_ENGINE_TYPE: 'binary',
    },
  });

  // Build Next.js with specific environment variables to avoid file watching
  console.log('Building Next.js application...');
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NEXT_WEBPACK_DISABLE_WATCHING: '1',
      CHOKIDAR_USEPOLLING: 'false',
      WATCHPACK_POLLING: 'false',
      NEXT_TELEMETRY_DISABLED: '1',
      NODE_OPTIONS: '--no-warnings --max-old-space-size=4096',
    },
  });

  console.log('Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
