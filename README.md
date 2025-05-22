# Project Management

This repository contains a project management application built with **Next.js** and **TypeScript**. It provides tools for managing projects, tasks, attendance, and teams.

## Features

- **Next.js 15** application with TypeScript and Tailwind CSS
- Authentication via **NextAuth**, supporting OAuth providers
- **Role and permission** based access control
- **Prisma** ORM with a MySQL database
- **Service Worker** for offline attendance tracking and background sync
- Project and task management with comments, attachments, and statuses
- Attendance features including check‑in/out, correction requests, and auto‑checkout
- Scripts for database setup, seeding, and production deployment

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Create an environment file**
   Copy `.env.example` to `.env` (or `.env.local`) and configure values such as:
   - `DATABASE_URL` – MySQL connection string
   - `NEXTAUTH_SECRET` – secret used by NextAuth
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` – OAuth credentials (optional)
   - `PORT` – port number for `server.js` (default `3000`)

3. **Prepare the database**
   ```bash
   npm run db:setup       # create the database
   npm run db:migrate     # apply migrations
   npm run db:seed        # seed initial data
   npm run db:seed-permissions
   npm run db:update-permissions
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## Production Deployment

For a full deployment guide see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). A helper script `scripts/setup-production.js` automates database setup, migrations, and seeding. Example commands:

```bash
npm run build
npm run start:pm2
```

## Useful Scripts

- `npm run lint` – run ESLint
- `npm run type-check` – run TypeScript compiler
- `npm run format` – format files with Prettier

## Directory Overview

- `app/` – Next.js routes and UI components
- `components/` – shared React components
- `lib/` – utilities (e.g., service worker helpers, Prisma client)
- `prisma/` – Prisma schema and migrations
- `public/` – static assets and `sw.js`
- `scripts/` – setup and seeding scripts
- `docs/` – additional documentation

## License

See [CHANGELOG.md](CHANGELOG.md) for recent changes. Licensing information is not specified in this repository.
