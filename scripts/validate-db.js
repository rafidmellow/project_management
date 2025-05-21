// scripts/validate-db.js
// Script to validate database connection and schema
/* eslint-disable no-console */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { PrismaClient } from '../prisma/generated/client/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

// Function to check if a file exists
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Function to validate database connection
async function validateDatabaseConnection() {
  logSection('Validating Database Connection');

  const prisma = new PrismaClient();

  try {
    // Check if we can connect to the database
    log('Attempting to connect to the database...', colors.yellow);
    await prisma.$connect();
    log('Successfully connected to the database', colors.green);

    // Get database URL from environment
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      logError('DATABASE_URL environment variable is not set');
      return false;
    }

    // Parse the database URL to extract connection details (without showing password)
    const matches = dbUrl.match(
      /mysql:\/\/([^:]+):[^@]*@([^:]+):(\d+)\/([^?]+)/,
    );
    if (!matches) {
      logError(
        'Invalid DATABASE_URL format. Expected: mysql://user:password@host:port/database',
      );
      return false;
    }

    const [, user, host, port, dbName] = matches;
    log(`Database connection details:`, colors.dim);
    log(`- Host: ${host}`, colors.dim);
    log(`- Port: ${port}`, colors.dim);
    log(`- User: ${user}`, colors.dim);
    log(`- Database: ${dbName}`, colors.dim);

    // Check if we can query the database
    log('Testing database query...', colors.yellow);
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    if (result && result.length > 0) {
      log('Database query successful', colors.green);
    } else {
      logError('Database query failed');
      return false;
    }

    return true;
  } catch (error) {
    logError('Database connection failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
    log('Database connection closed', colors.dim);
  }
}

// Function to validate Prisma schema
async function validatePrismaSchema() {
  logSection('Validating Prisma Schema');

  try {
    // Check if schema.prisma exists
    const schemaPath = path.join(rootDir, 'prisma', 'schema.prisma');
    if (!(await fileExists(schemaPath))) {
      logError(`Prisma schema file not found at ${schemaPath}`);
      return false;
    }

    log(`Found Prisma schema at ${schemaPath}`, colors.green);

    // Check if migrations directory exists
    const migrationsDir = path.join(rootDir, 'prisma', 'migrations');
    if (!existsSync(migrationsDir)) {
      log(`Migrations directory not found at ${migrationsDir}`, colors.yellow);
      log(
        'You may need to run "npx prisma migrate dev" to create migrations',
        colors.yellow,
      );
    } else {
      // Count migrations
      const migrations = await fs.readdir(migrationsDir);
      log(
        `Found ${migrations.length} migration(s) in ${migrationsDir}`,
        colors.green,
      );

      // List migrations
      for (const migration of migrations) {
        log(`- ${migration}`, colors.dim);
      }
    }

    // Check if generated client exists
    const clientDir = path.join(rootDir, 'prisma', 'generated', 'client');
    if (!existsSync(clientDir)) {
      logError(`Generated Prisma client not found at ${clientDir}`);
      log(
        'You may need to run "npx prisma generate" to generate the client',
        colors.yellow,
      );
      return false;
    }

    log(`Found generated Prisma client at ${clientDir}`, colors.green);

    return true;
  } catch (error) {
    logError('Error validating Prisma schema:', error);
    return false;
  }
}

// Main function
async function main() {
  log('Starting database validation...', colors.bright);

  try {
    // Validate database connection
    const connectionValid = await validateDatabaseConnection();
    if (!connectionValid) {
      logError('Database connection validation failed');
      return false;
    }

    // Validate Prisma schema
    const schemaValid = await validatePrismaSchema();
    if (!schemaValid) {
      logError('Prisma schema validation failed');
      return false;
    }

    logSection('Validation Completed Successfully');
    return true;
  } catch (error) {
    logSection('Validation Failed');
    logError(error.message, error);
    return false;
  }
}

// Run the main function
main()
  .then((success) => {
    if (success) {
      log('Database validation completed successfully', colors.green);
      process.exit(0);
    } else {
      logError('Database validation failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    logError('Unhandled error during validation:', error);
    process.exit(1);
  });
