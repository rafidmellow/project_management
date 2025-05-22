// scripts/setup-production.js
// Script to set up the production environment

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Load environment variables from .env.production
dotenv.config({ path: '.env.production' });

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
  console.error(`${colors.red}${colors.bright}ERROR: ${message}${colors.reset}`);
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
    log(`Running: ${colors.bright}${command} ${args.join(' ')}${colors.reset}`, colors.yellow);

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

    childProcess.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${command} ${args.join(' ')}`));
      }
    });

    childProcess.on('error', error => {
      reject(new Error(`Failed to start command: ${error.message}`));
    });
  });
}

// Function to set up the database
async function setupDatabase() {
  logSection('Setting up Database');

  // Extract database name from DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    logError('DATABASE_URL environment variable is not set in .env.production');
    process.exit(1);
  }

  // Print the DATABASE_URL for debugging (masking the password)
  const maskedUrl = dbUrl.replace(/(mysql:\/\/[^:]+:)([^@]*)(@.*)/, '$1*****$3');
  log(`Using database URL: ${maskedUrl}`, colors.dim);

  // Parse the database URL to extract connection details
  const matches = dbUrl.match(/mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/([^?]+)/);

  if (!matches) {
    logError('Invalid DATABASE_URL format. Expected: mysql://user:password@host:port/database');
    process.exit(1);
  }

  // Extract connection details from the regex match
  const [, dbUser, dbPassword, dbHost, dbPort, dbName] = matches;

  // Decode the password (it's URL encoded in the connection string)
  const decodedPassword = decodeURIComponent(dbPassword);

  log(`Database connection details:`, colors.dim);
  log(`- Host: ${dbHost}`, colors.dim);
  log(`- Port: ${dbPort}`, colors.dim);
  log(`- User: ${dbUser}`, colors.dim);
  log(`- Database: ${dbName}`, colors.dim);
  log(`- Password (encoded): ${dbPassword}`, colors.dim);
  log(`- Password (decoded): ${decodedPassword}`, colors.dim);

  try {
    // Create connection to MySQL server (without database)
    log('Connecting to MySQL server...', colors.yellow);
    log('Attempting connection with decoded password...', colors.yellow);

    const connection = await mysql.createConnection({
      host: dbHost,
      port: parseInt(dbPort, 10),
      user: dbUser,
      password: decodedPassword, // Use decoded password
    });

    log(`Connected to MySQL server at ${dbHost}:${dbPort}`, colors.green);

    // Check if database exists
    const [rows] = await connection.execute(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [dbName]
    );

    if (rows.length > 0) {
      log(`Database '${dbName}' already exists`, colors.green);
    } else {
      // Create database
      log(`Creating database '${dbName}'...`, colors.yellow);
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      log(`Database '${dbName}' created successfully`, colors.green);
    }

    // Close connection
    await connection.end();
    log('Database setup completed', colors.green);
    return true;
  } catch (error) {
    logError('Error setting up database:', error);
    return false;
  }
}

// Function to generate Prisma client
async function generatePrismaClient() {
  logSection('Generating Prisma Client');
  try {
    await runCommand('npx', ['prisma', 'generate']);
    log('Prisma client generated successfully', colors.green);
    return true;
  } catch (error) {
    logError('Error generating Prisma client:', error);
    return false;
  }
}

// Function to run database migrations
async function runMigrations() {
  logSection('Running Database Migrations');
  try {
    // Create the migrations directory if it doesn't exist
    const migrationsDir = path.join(rootDir, 'prisma', 'migrations');
    if (!existsSync(migrationsDir)) {
      await fs.mkdir(migrationsDir, { recursive: true });
      log('Created migrations directory', colors.yellow);
    }

    // Run prisma db push instead of migrate deploy (safer for production)
    await runCommand('npx', ['prisma', 'db', 'push', '--accept-data-loss']);
    log('Database schema pushed successfully', colors.green);
    return true;
  } catch (error) {
    logError('Error running migrations:', error);
    return false;
  }
}

// Function to seed the database
async function seedDatabase() {
  logSection('Seeding Database');
  try {
    await runCommand('node', ['scripts/seed.js']);
    log('Database seeded successfully', colors.green);

    // Run additional seed scripts if they exist
    if (existsSync(path.join(rootDir, 'scripts', 'seed-permissions.js'))) {
      await runCommand('node', ['scripts/seed-permissions.js']);
      log('Permissions seeded successfully', colors.green);
    }

    if (existsSync(path.join(rootDir, 'scripts', 'update-edge-permissions-fixed.js'))) {
      await runCommand('node', ['scripts/update-edge-permissions-fixed.js']);
      log('Edge permissions updated successfully', colors.green);
    }

    return true;
  } catch (error) {
    logError('Error seeding database:', error);
    return false;
  }
}

// Main function
async function main() {
  log('Starting production setup...', colors.bright);
  log(`Node.js version: ${process.version}`, colors.dim);
  log(`Current working directory: ${process.cwd()}`, colors.dim);

  try {
    // Step 1: Set up the database
    const dbSetup = await setupDatabase();
    if (!dbSetup) {
      logError('Database setup failed. Aborting.');
      process.exit(1);
    }

    // Step 2: Generate Prisma client
    const prismaGenerated = await generatePrismaClient();
    if (!prismaGenerated) {
      logError('Prisma client generation failed. Aborting.');
      process.exit(1);
    }

    // Step 3: Run database migrations
    const migrationsRun = await runMigrations();
    if (!migrationsRun) {
      logError('Database migrations failed. Aborting.');
      process.exit(1);
    }

    // Step 4: Seed the database
    const databaseSeeded = await seedDatabase();
    if (!databaseSeeded) {
      logError('Database seeding failed. Aborting.');
      process.exit(1);
    }

    logSection('Production Setup Completed Successfully');
    return true;
  } catch (error) {
    logSection('Production Setup Failed');
    logError(error.message, error);
    return false;
  }
}

// Run the main function
main()
  .then(success => {
    if (success) {
      log('Production setup completed successfully', colors.green);
      process.exit(0);
    } else {
      logError('Production setup failed');
      process.exit(1);
    }
  })
  .catch(error => {
    logError('Unhandled error during production setup:', error);
    process.exit(1);
  });
