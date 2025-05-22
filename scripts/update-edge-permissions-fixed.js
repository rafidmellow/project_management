// scripts/update-edge-permissions-fixed.js
// Fixed script to update edge-permission-service.ts with current permission data from the database

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '../prisma/generated/client/index.js';

// Get the directory name using ES modules pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize PrismaClient with direct import from generated path
const prisma = new PrismaClient();

async function updateEdgePermissions() {
  console.log('Starting edge permissions update...');

  try {
    // Get all roles with their permissions
    console.log('Fetching roles and permissions from database...');
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    console.log(`Found ${roles.length} roles in the database`);

    // Create a mapping of role names to permission names
    const rolePermissions = {};

    roles.forEach(role => {
      rolePermissions[role.name] = role.permissions.map(rp => rp.permission.name);
      console.log(`Role "${role.name}" has ${role.permissions.length} permissions`);
    });

    // Read the current edge-permission-service.ts file
    const filePath = path.join(process.cwd(), 'lib', 'permissions', 'edge-permission-service.ts');
    console.log(`Reading file: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return false;
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log(`File read successfully (${fileContent.length} bytes)`);

    // Find the ROLE_PERMISSIONS section
    const startMarker = 'private static readonly ROLE_PERMISSIONS: Record<string, string[]> = ';
    const startIndex = fileContent.indexOf(startMarker);

    if (startIndex === -1) {
      console.error('Could not find ROLE_PERMISSIONS section in the file');
      return false;
    }

    const actualStartIndex = startIndex + startMarker.length;
    console.log(`Found ROLE_PERMISSIONS section at position ${startIndex}`);

    // Find the end of the object (the closing brace)
    let endIndex = actualStartIndex;
    let braceCount = 0;
    let inObject = false;

    for (let i = actualStartIndex; i < fileContent.length; i++) {
      const char = fileContent[i];

      if (char === '{') {
        braceCount++;
        inObject = true;
      } else if (char === '}') {
        braceCount--;

        // If we've found the closing brace of the object
        if (inObject && braceCount === 0) {
          // Look for the next non-whitespace character
          let j = i + 1;
          while (j < fileContent.length && /\s/.test(fileContent[j])) {
            j++;
          }

          // If the next non-whitespace character is a semicolon, include it
          if (j < fileContent.length && fileContent[j] === ';') {
            endIndex = j + 1;
          } else {
            // Otherwise, just use the position after the closing brace
            endIndex = i + 1;
          }
          break;
        }
      }
    }

    if (endIndex === actualStartIndex) {
      console.error('Could not find the end of the ROLE_PERMISSIONS object');
      return false;
    }

    console.log(`Found end of ROLE_PERMISSIONS object at position ${endIndex}`);

    // Replace the ROLE_PERMISSIONS object with the new data
    const newContent =
      fileContent.substring(0, actualStartIndex) +
      JSON.stringify(rolePermissions, null, 2) +
      fileContent.substring(endIndex);

    // Write the updated file
    console.log('Writing updated file...');
    fs.writeFileSync(filePath, newContent);
    console.log('Edge permissions updated successfully');

    return true;
  } catch (error) {
    console.error('Error updating edge permissions:', error);
    return false;
  } finally {
    await prisma.$disconnect();
    console.log('Prisma client disconnected');
  }
}

// Run the function and handle any errors
console.log('Node.js version:', process.version);
console.log('Current working directory:', process.cwd());

updateEdgePermissions()
  .then(success => {
    if (success) {
      console.log('Edge permissions update completed successfully');
      process.exit(0);
    } else {
      console.error('Edge permissions update failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error during edge permissions update:', error);
    process.exit(1);
  });
