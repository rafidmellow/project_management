// server.js - Custom server for Next.js application on cPanel
/* eslint-disable no-undef */
/* eslint-disable no-console */
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get the directory name using ES modules pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine environment
const dev = process.env.NODE_ENV !== 'production';

// Initialize Next.js app
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

// Define port - cPanel typically assigns a port via environment variable
// Default to 3000 for local development
const port = process.env.PORT || 3000;

// Log startup information
console.log(`> Starting server...`);
console.log(`> Environment: ${dev ? 'development' : 'production'}`);
console.log(`> Directory: ${__dirname}`);

// Prepare the application
app
  .prepare()
  .then(() => {
    // Create HTTP server
    const server = createServer(async (req, res) => {
      try {
        // Parse the URL
        const parsedUrl = parse(req.url, true);

        // Let Next.js handle the request
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    // Handle server errors
    server.on('error', err => {
      console.error('Server error:', err);
    });

    // Start listening
    server.listen(port, err => {
      if (err) throw err;

      // PM2 is the preferred deployment method
      // Log PM2 deployment instructions
      console.log('> For PM2 deployment, use: pm2 start npm --name "project-management" -- start');

      // Log server start
      const address = server.address();
      const host = address.address === '::' ? 'localhost' : address.address;
      console.log(`> Ready on http://${host}:${address.port}`);
      console.log(`> Mode: ${dev ? 'development' : 'production'}`);
    });
  })
  .catch(err => {
    console.error('Error starting server:', err);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
