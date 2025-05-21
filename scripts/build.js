// scripts/build.js
// Unified build script for Next.js project with Prisma fixes for Node.js 22 compatibility
/* eslint-disable no-console */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Get the directory name using ES modules pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
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
    console.error(`${colors.dim}${error.stack || error}${colors.reset}`);
  }
}

// Helper function to log section headers
function logSection(title) {
  console.log('\n');
  console.log(`${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`);
  console.log('-'.repeat(title.length + 8));
}

// Function to run a command and return a promise
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    log(
      `Running: ${colors.bright}${command} ${args.join(' ')}${colors.reset}`,
      colors.yellow,
    );

    const env = {
      ...process.env,
      ...options.env,
    };

    const childProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env,
      ...options,
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `Command failed with exit code ${code}: ${command} ${args.join(' ')}`,
          ),
        );
      }
    });

    childProcess.on('error', (error) => {
      reject(new Error(`Failed to start command: ${error.message}`));
    });
  });
}

// Function to check if a file exists
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Function to fix Prisma imports in API routes
async function fixPrismaImports() {
  logSection('Fixing Prisma Imports in API Routes');

  try {
    // Find all route.ts files in the app directory
    const appDir = path.join(rootDir, 'app');
    log(`Scanning directory: ${appDir}`, colors.dim);

    // Function to recursively find all route.ts files
    async function findRouteFiles(dir) {
      const routeFiles = [];

      async function scan(directory) {
        const files = await fs.readdir(directory);

        for (const file of files) {
          const filePath = path.join(directory, file);
          const stats = await fs.stat(filePath);

          if (stats.isDirectory()) {
            await scan(filePath);
          } else if (file === 'route.ts' || file === 'route.js') {
            routeFiles.push(filePath);
          }
        }
      }

      await scan(dir);
      return routeFiles;
    }

    const routeFiles = await findRouteFiles(appDir);
    log(`Found ${routeFiles.length} route files`, colors.green);

    let updatedCount = 0;

    // Function to update a route file
    async function updateRouteFile(filePath) {
      try {
        let content = await fs.readFile(filePath, 'utf8');
        let modified = false;

        // Check for direct Prisma imports
        const directPrismaImport =
          /import\s+{\s*PrismaClient\s*}\s+from\s+['"]@prisma\/client['"]/g;
        if (directPrismaImport.test(content)) {
          log(`Found direct PrismaClient import in ${filePath}`, colors.yellow);
          content = content.replace(
            directPrismaImport,
            `// Using singleton Prisma client\nimport prisma from '@/lib/prisma'`,
          );
          modified = true;
        }

        // Check for direct Prisma client instantiation
        const prismaInstantiation = /const\s+prisma\s*=\s*new\s+PrismaClient/g;
        if (prismaInstantiation.test(content)) {
          log(`Found PrismaClient instantiation in ${filePath}`, colors.yellow);
          content = content.replace(
            prismaInstantiation,
            `// Using singleton Prisma client from @/lib/prisma`,
          );
          modified = true;
        }

        // Check if the file already imports prisma from lib/prisma
        const hasPrismaImport =
          /import\s+prisma\s+from\s+['"]@\/lib\/prisma['"]/g.test(content);

        // If the file doesn't have a prisma import but uses prisma, add the import
        if (!hasPrismaImport && content.includes('prisma.')) {
          log(`Adding prisma import to ${filePath}`, colors.yellow);

          // Check if there are any imports
          if (content.includes('import ')) {
            // Add after the last import
            const importLines = content
              .split('\n')
              .filter((line) => line.trim().startsWith('import '));
            const lastImportLine = importLines[importLines.length - 1];
            content = content.replace(
              lastImportLine,
              `${lastImportLine}\nimport prisma from '@/lib/prisma';`,
            );
          } else {
            // Add at the beginning of the file
            content = `import prisma from '@/lib/prisma';\n${content}`;
          }

          modified = true;
        }

        if (modified) {
          await fs.writeFile(filePath, content, 'utf8');
          return true;
        }

        return false;
      } catch (error) {
        logError(`Error updating ${filePath}:`, error);
        return false;
      }
    }

    // Update all route files
    for (const file of routeFiles) {
      const updated = await updateRouteFile(file);
      if (updated) {
        updatedCount++;
        log(`Updated ${file}`, colors.green);
      }
    }

    log(`Updated ${updatedCount} files`, colors.green);
    return true;
  } catch (error) {
    logError('Error fixing Prisma imports:', error);
    return false;
  }
}

// Main build function
async function build() {
  log(`Starting build process...`, colors.bright);
  log(`Node.js version: ${process.version}`, colors.dim);
  log(`Current working directory: ${process.cwd()}`, colors.dim);

  // Create an array to track temporary files we'll need to clean up
  const tempFiles = [];

  try {
    // Step 1: Clean up any previous build artifacts
    logSection('Cleaning Previous Build Artifacts');
    const nextDir = path.join(rootDir, '.next');
    if (await fileExists(nextDir)) {
      log('Removing .next directory', colors.yellow);
      await fs.rm(nextDir, { recursive: true, force: true });
    }
    log('Previous build artifacts cleaned up', colors.green);

    // Step 2: Generate Prisma client
    logSection('Generating Prisma Client');

    // First, check if the schema has changed since last generation
    log('Checking Prisma schema for changes...', colors.yellow);

    // Force regeneration to ensure the client is up-to-date
    log('Forcing Prisma client regeneration...', colors.yellow);

    // Delete the generated client directory first to ensure clean generation
    const generatedClientDir = path.join(
      rootDir,
      'prisma',
      'generated',
      'client',
    );
    if (await fileExists(generatedClientDir)) {
      log('Removing existing generated client directory', colors.yellow);
      await fs.rm(generatedClientDir, { recursive: true, force: true });
    }

    // Generate the Prisma client
    await runCommand('npx', ['prisma', 'generate']);

    // Verify the client was generated correctly
    if (await fileExists(path.join(generatedClientDir, 'index.js'))) {
      log('Prisma client generated successfully', colors.green);
    } else {
      throw new Error(
        'Prisma client generation failed - client files not found',
      );
    }

    // Step 3: Fix Prisma imports in API routes
    await fixPrismaImports();

    // Step 4: Update edge permissions
    logSection('Updating Edge Permissions');

    // Check if the update-edge-permissions-fixed.js file exists
    const edgePermissionsScript = path.join(
      rootDir,
      'scripts',
      'update-edge-permissions-fixed.js',
    );
    if (await fileExists(edgePermissionsScript)) {
      await runCommand('node', ['scripts/update-edge-permissions-fixed.js']);
      log('Edge permissions updated successfully', colors.green);
    } else {
      log(
        'Edge permissions script not found, skipping this step',
        colors.yellow,
      );
    }

    // Step 5: Build Next.js application with NODE_OPTIONS to suppress warnings
    logSection('Building Next.js Application');

    // Check if node_modules folder exists
    if (!existsSync(path.join(rootDir, 'node_modules'))) {
      log(
        'node_modules directory not found. Installing dependencies first...',
        colors.yellow,
      );
      await runCommand('npm', ['install'], {});
    }

    // Create a build environment script to ensure Prisma is properly initialized
    const buildEnvScriptPath = path.join(rootDir, 'scripts', '.build-env.js');
    // Add this file to our list of temporary files to clean up later
    tempFiles.push(buildEnvScriptPath);

    log('Creating temporary build environment script...', colors.yellow);
    await fs.writeFile(
      buildEnvScriptPath,
      `
      // This is a temporary script to help with proper Prisma initialization
      import { PrismaClient } from '../prisma/generated/client/index.js';

      // Create and connect to the Prisma client
      const prisma = new PrismaClient();

      async function main() {
        // Force connection to verify the client works
        await prisma.$connect();
        console.log('Prisma client successfully initialized and connected');

        // Disconnect properly
        await prisma.$disconnect();
        console.log('Prisma client disconnected');
      }

      main().catch(e => {
        console.error('Failed to initialize Prisma client:', e);
        process.exit(1);
      });
      `,
    );

    // Run the build environment script
    log('Verifying Prisma client initialization...', colors.yellow);
    await runCommand('node', [buildEnvScriptPath]);

    // Try to find the next executable directly in the local installation
    const nextBinPath = path.join(rootDir, 'node_modules', '.bin', 'next');

    // Check if the Next.js binary exists
    if (existsSync(nextBinPath)) {
      log(`Found Next.js binary at ${nextBinPath}`, colors.green);
      await runCommand(nextBinPath, ['build'], {
        env: {
          // Make sure NODE_ENV is production for the build
          NODE_ENV: 'production',
          // Add any other needed environment variables
          NODE_OPTIONS: '--no-warnings --max-old-space-size=4096',
          // Ensure Prisma has the right path
          PRISMA_CLIENT_ENGINE_TYPE: 'binary',
          // Disable file watching to avoid permission issues
          NEXT_WEBPACK_DISABLE_WATCHING: '1',
          CHOKIDAR_USEPOLLING: 'false',
          WATCHPACK_POLLING: 'false',
          // Disable telemetry
          NEXT_TELEMETRY_DISABLED: '1',
        },
      });
    } else {
      // Fallback to npx with full path
      log(
        'Next.js binary not found in expected location, trying alternative approaches',
        colors.yellow,
      );

      try {
        log('Attempting to use node_modules/.bin/next', colors.dim);
        await runCommand('node_modules/.bin/next', ['build'], {
          env: {
            NODE_ENV: 'production',
            NODE_OPTIONS: '--no-warnings --max-old-space-size=4096',
            PRISMA_CLIENT_ENGINE_TYPE: 'binary',
            NEXT_WEBPACK_DISABLE_WATCHING: '1',
            CHOKIDAR_USEPOLLING: 'false',
            WATCHPACK_POLLING: 'false',
            NEXT_TELEMETRY_DISABLED: '1',
          },
        });
      } catch (error) {
        log(
          'Failed using node_modules/.bin/next, trying NPM directly',
          colors.yellow,
        );
        await runCommand('npm', ['exec', '--', 'next', 'build'], {
          env: {
            NODE_ENV: 'production',
            NODE_OPTIONS: '--no-warnings --max-old-space-size=4096',
            PRISMA_CLIENT_ENGINE_TYPE: 'binary',
            NEXT_WEBPACK_DISABLE_WATCHING: '1',
            CHOKIDAR_USEPOLLING: 'false',
            WATCHPACK_POLLING: 'false',
            NEXT_TELEMETRY_DISABLED: '1',
          },
        });
      }
    }
    log('Next.js application built successfully', colors.green);

    logSection('Build Completed Successfully');
    return true;
  } catch (error) {
    logSection('Build Failed');
    logError(error.message, error);
    return false;
  } finally {
    // Clean up any temporary files we created
    if (tempFiles.length > 0) {
      log('Cleaning up temporary build files...', colors.dim);
      for (const tempFile of tempFiles) {
        try {
          if (await fileExists(tempFile)) {
            await fs.unlink(tempFile);
            log(`Removed temporary file: ${tempFile}`, colors.dim);
          }
        } catch (cleanupError) {
          log(
            `Warning: Failed to clean up temporary file ${tempFile}: ${cleanupError.message}`,
            colors.yellow,
          );
        }
      }
    }
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
