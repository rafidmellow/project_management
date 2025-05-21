// scripts/verify-prisma.js
// Script to verify Prisma client generation before build
/* eslint-disable no-console */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

// Get the directory name using ES modules pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const clientPath = path.join(rootDir, 'prisma', 'generated', 'client');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

// Verify the Prisma client is generated and up-to-date
const schemaPath = path.join(rootDir, 'prisma', 'schema.prisma');
const schemaExists = fs.existsSync(schemaPath);
const clientExists = fs.existsSync(clientPath);
const indexJsExists = fs.existsSync(path.join(clientPath, 'index.js'));

// Check if schema exists
if (!schemaExists) {
  console.error(
    `${colors.red}[ERROR]${colors.reset} Prisma schema not found at ${schemaPath}`,
  );
  process.exit(1);
}

// Check if client exists and is complete
if (!clientExists || !indexJsExists) {
  console.error(
    `${colors.red}[ERROR]${colors.reset} Prisma client not found or incomplete at ${clientPath}`,
  );
  console.log(
    `${colors.yellow}[INFO]${colors.reset} Generating Prisma client...`,
  );

  try {
    // For ESM compatibility, use dynamic import
    const { execSync } = await import('node:child_process');

    // Force clean generation
    if (clientExists) {
      console.log(
        `${colors.yellow}[INFO]${colors.reset} Removing existing client directory for clean generation`,
      );
      fs.rmSync(clientPath, { recursive: true, force: true });
    }

    // Generate Prisma client
    execSync('npx prisma generate', { stdio: 'inherit', cwd: rootDir });

    // Check again after generation
    if (!fs.existsSync(path.join(clientPath, 'index.js'))) {
      console.error(
        `${colors.red}[ERROR]${colors.reset} Failed to generate Prisma client`,
      );
      process.exit(1);
    }

    console.log(
      `${colors.green}[SUCCESS]${colors.reset} Prisma client generated successfully`,
    );
  } catch (error) {
    console.error(
      `${colors.red}[ERROR]${colors.reset} Failed to generate Prisma client: ${error.message}`,
    );
    process.exit(1);
  }
} else {
  // Check if schema has been modified more recently than the client
  const schemaStats = fs.statSync(schemaPath);
  const clientStats = fs.statSync(path.join(clientPath, 'index.js'));

  if (schemaStats.mtime > clientStats.mtime) {
    console.log(
      `${colors.yellow}[WARNING]${colors.reset} Schema has been modified since client generation`,
    );
    console.log(
      `${colors.yellow}[INFO]${colors.reset} Regenerating Prisma client...`,
    );

    try {
      const { execSync } = await import('node:child_process');
      execSync('npx prisma generate', { stdio: 'inherit', cwd: rootDir });
      console.log(
        `${colors.green}[SUCCESS]${colors.reset} Prisma client regenerated successfully`,
      );
    } catch (error) {
      console.error(
        `${colors.red}[ERROR]${colors.reset} Failed to regenerate Prisma client: ${error.message}`,
      );
      process.exit(1);
    }
  } else {
    console.log(
      `${colors.green}[SUCCESS]${colors.reset} Prisma client exists and is up-to-date at ${clientPath}`,
    );
  }
}
