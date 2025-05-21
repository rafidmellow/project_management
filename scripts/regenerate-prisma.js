// scripts/regenerate-prisma.js
// Script to force regenerate the Prisma client
/* eslint-disable no-console */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

// Get the directory name using ES modules pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const clientPath = path.join(rootDir, 'prisma', 'generated', 'client');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

console.log(
  `${colors.bright}${colors.blue}=== Prisma Client Regeneration ===${colors.reset}`,
);
console.log('-'.repeat(32));

// Check if the client directory exists
if (fs.existsSync(clientPath)) {
  console.log(
    `${colors.yellow}[INFO]${colors.reset} Removing existing Prisma client directory...`,
  );
  try {
    fs.rmSync(clientPath, { recursive: true, force: true });
    console.log(
      `${colors.green}[SUCCESS]${colors.reset} Existing client directory removed`,
    );
  } catch (error) {
    console.error(
      `${colors.red}[ERROR]${colors.reset} Failed to remove client directory: ${error.message}`,
    );
    process.exit(1);
  }
} else {
  console.log(
    `${colors.yellow}[INFO]${colors.reset} No existing client directory found`,
  );
}

// Generate the Prisma client
console.log(
  `${colors.yellow}[INFO]${colors.reset} Generating Prisma client...`,
);
try {
  execSync('npx prisma generate', { stdio: 'inherit', cwd: rootDir });

  // Verify the client was generated
  if (fs.existsSync(path.join(clientPath, 'index.js'))) {
    console.log(
      `${colors.green}[SUCCESS]${colors.reset} Prisma client generated successfully`,
    );
  } else {
    console.error(
      `${colors.red}[ERROR]${colors.reset} Client generation completed but files not found`,
    );
    process.exit(1);
  }
} catch (error) {
  console.error(
    `${colors.red}[ERROR]${colors.reset} Failed to generate Prisma client: ${error.message}`,
  );
  process.exit(1);
}

// Verify the client works by importing it
console.log(`${colors.yellow}[INFO]${colors.reset} Verifying Prisma client...`);

// Create a temporary verification script
const verifyScriptPath = path.join(
  rootDir,
  'scripts',
  '.verify-prisma-temp.js',
);
fs.writeFileSync(
  verifyScriptPath,
  `
// Temporary script to verify Prisma client
import { PrismaClient } from '../prisma/generated/client/index.js';

async function main() {
  const prisma = new PrismaClient();
  try {
    // Try to connect to the database
    await prisma.$connect();
    console.log('Successfully connected to the database');

    // Try a simple query to verify the client works
    const userCount = await prisma.user.count();
    console.log(\`Database has \${userCount} users\`);

    // Disconnect
    await prisma.$disconnect();
    console.log('Successfully disconnected from the database');

    return true;
  } catch (error) {
    console.error('Error verifying Prisma client:', error);
    await prisma.$disconnect().catch(() => {});
    return false;
  }
}

main()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
`,
);

try {
  console.log(
    `${colors.yellow}[INFO]${colors.reset} Running verification script...`,
  );
  execSync(`node ${verifyScriptPath}`, { stdio: 'inherit', cwd: rootDir });
  console.log(
    `${colors.green}[SUCCESS]${colors.reset} Prisma client verified successfully`,
  );
} catch (error) {
  console.error(
    `${colors.red}[ERROR]${colors.reset} Prisma client verification failed: ${error.message}`,
  );
  process.exit(1);
} finally {
  // Clean up the temporary script
  if (fs.existsSync(verifyScriptPath)) {
    fs.unlinkSync(verifyScriptPath);
  }
}

console.log(
  `${colors.bright}${colors.green}=== Prisma Client Regeneration Complete ===${colors.reset}`,
);
console.log(
  `You can now build your application with: ${colors.bright}npm run build${colors.reset}`,
);
