// scripts/server-build.js
// Simplified server build script for Next.js with Prisma
/* eslint-disable no-console */

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

// Get the directory name using ES modules pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

// Helper function to log with colors
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to log errors
function logError(message, error = null) {
  console.error(
    `${colors.red}${colors.bright}ERROR: ${message}${colors.reset}`,
  );
  if (error) {
    console.error(`${error.stack || error}`);
  }
}

// Helper function to log section headers
function logSection(title) {
  console.log('\n');
  console.log(`${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`);
  console.log('-'.repeat(title.length + 8));
}

// Main build function
async function build() {
  log(`Starting server build process...`, colors.bright);
  log(`Node.js version: ${process.version}`);
  log(`Current working directory: ${process.cwd()}`);

  try {
    // Step 1: Clean up any previous build artifacts
    logSection('Cleaning Previous Build Artifacts');
    const nextDir = path.join(rootDir, '.next');
    if (fs.existsSync(nextDir)) {
      log('Removing .next directory', colors.yellow);
      fs.rmSync(nextDir, { recursive: true, force: true });
    }
    log('Previous build artifacts cleaned up', colors.green);

    // Step 2: Generate Prisma client
    logSection('Generating Prisma Client');
    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: rootDir,
      env: {
        ...process.env,
        PRISMA_CLIENT_ENGINE_TYPE: 'binary',
      },
    });
    log('Prisma client generated successfully', colors.green);

    // Step 3: Build Next.js application
    logSection('Building Next.js Application');

    // Use the local next binary from node_modules
    const nextBinPath = path.join(rootDir, 'node_modules', '.bin', 'next');

    if (fs.existsSync(nextBinPath)) {
      log(`Found Next.js binary at ${nextBinPath}`, colors.green);
      execSync(`${nextBinPath} build`, {
        stdio: 'inherit',
        cwd: rootDir,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          NODE_OPTIONS: '--no-warnings --max-old-space-size=4096',
          NEXT_WEBPACK_DISABLE_WATCHING: '1',
          CHOKIDAR_USEPOLLING: 'false',
          NEXT_TELEMETRY_DISABLED: '1',
        },
      });
    } else {
      // Fallback to npx
      log('Next.js binary not found, using npx instead', colors.yellow);
      execSync('npx next build', {
        stdio: 'inherit',
        cwd: rootDir,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          NODE_OPTIONS: '--no-warnings --max-old-space-size=4096',
          NEXT_WEBPACK_DISABLE_WATCHING: '1',
          CHOKIDAR_USEPOLLING: 'false',
          NEXT_TELEMETRY_DISABLED: '1',
        },
      });
    }

    log('Next.js application built successfully', colors.green);
    logSection('Build Completed Successfully');
    return true;
  } catch (error) {
    logSection('Build Failed');
    logError(error.message, error);
    return false;
  }
}

// Run the build function
build()
  .then((success) => {
    if (success) {
      log('Build process completed successfully', colors.green);
      process.exit(0);
    } else {
      logError('Build process failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    logError('Unhandled error during build:', error);
    process.exit(1);
  });
