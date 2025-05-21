// scripts/setup-admin-only.js
// Script to set up the database with only admin user and permissions
/* eslint-disable no-console */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Get the directory name using ES modules pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Function to run a command and return a promise
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);

    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Main function to run the setup
async function setupAdminOnly() {
  console.log('Starting admin-only setup...');

  try {
    // Step 1: Run the seed-admin-only.js script
    console.log(
      '\n=== STEP 1: Seeding database with admin user and permissions ===',
    );
    await runCommand('node', ['scripts/seed-admin-only.js']);

    // Step 2: Update edge permissions
    console.log('\n=== STEP 2: Updating edge permissions ===');
    await runCommand('node', ['scripts/update-edge-permissions-admin-only.js']);

    console.log('\n=== SETUP COMPLETED SUCCESSFULLY ===');
    console.log('Admin user created with:');
    console.log('  Email: admin@example.com');
    console.log('  Password: admin123');
    console.log('\nYou can now log in with these credentials.');

    return true;
  } catch (error) {
    console.error('\n=== SETUP FAILED ===');
    console.error('Error during admin-only setup:', error);
    return false;
  }
}

// Run the setup function
setupAdminOnly()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unhandled error during setup:', error);
    process.exit(1);
  });
