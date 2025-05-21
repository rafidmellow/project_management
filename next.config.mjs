let userConfig = undefined
try {
  // try to import ESM first
  userConfig = await import('./v0-user-next.config.mjs')
} catch {
  try {
    // fallback to CJS import
    userConfig = await import("./v0-user-next.config");
  } catch {
    // ignore error
  }
}

import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ['app', 'components', 'lib', 'hooks', 'types', 'utils', 'providers'],
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Set to false once you've fixed all TypeScript errors
    // For production, you should fix TypeScript errors and set this to false
    ignoreBuildErrors: true
  },
  images: {
    unoptimized: false,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  headers: async () => {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
  // Combined webpack configuration with Prisma path resolution
  webpack: (config, { isServer }) => {
    // Enable caching
    config.cache = true;

    // Handle Prisma client generation for server builds
    if (isServer) {
      config.resolve = {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          '@prisma/client': path.resolve('./prisma/generated/client'),
          '@prisma/client/edge': path.resolve('./prisma/generated/client/edge'),
        }
      };
    }

    return config;
  },
}

if (userConfig) {
  // ESM imports will have a "default" property
  const config = userConfig.default || userConfig

  for (const key in config) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...config[key],
      }
    } else {
      nextConfig[key] = config[key]
    }
  }
}

export default nextConfig
