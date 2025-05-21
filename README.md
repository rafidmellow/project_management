# Project Management System

A comprehensive enterprise project management application built with Next.js 15, Prisma, and MySQL, featuring offline capabilities and attendance tracking with geolocation.

## Features

- **User Authentication & Authorization**
  - Social login with Google and Facebook
  - Role-based access control (Admin, Manager, User, Guest)
  - Database-backed dynamic permission system manageable through the UI
  - Secure password handling and JWT authentication

- **Project Management**
  - Flexible project statuses with customizable workflows
  - Team collaboration with member management
  - Comprehensive project details and analytics
  - Event tracking and milestone management

- **Task Management**
  - Kanban board with drag-and-drop functionality
  - List view with grouping by status
  - Nested subtasks with ordering capabilities
  - Task comments and file attachments
  - Time tracking and estimation

- **Attendance System**
  - Field attendance tracking with geolocation and location name display
  - Check-in/check-out functionality with offline support
  - Background sync for offline attendance actions
  - Comprehensive attendance analytics and reporting
  - Auto-checkout, overtime calculation, and correction requests
  - Customizable work hours and attendance settings

- **User Experience**
  - Responsive design for all devices
  - Modern UI with dark/light mode support
  - Real-time updates without page refreshes
  - Progressive Web App (PWA) capabilities

## Tech Stack

- **Frontend**: Next.js 15, React 18, Tailwind CSS, shadcn/ui (Radix UI)
- **Backend**: Next.js API Routes with App Router
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js
- **State Management**: SWR for data fetching and caching
- **Offline Support**: Service Workers with Background Sync

## Prerequisites

- Node.js (v18+)
- MySQL (via XAMPP or standalone)
- Git

## Setup Instructions

1. **Clone the repository**

```bash
git clone <repository-url>
cd project-management
```

2. **Install dependencies**

```bash
npm install --legacy-peer-deps
```

3. **Configure environment variables**

Create a `.env` file in the root directory with the following content:

```
# Database
DATABASE_URL="mysql://root:@localhost:3306/projectpro_new"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-for-jwt"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"
```

4. **Start MySQL**

Make sure MySQL is running via XAMPP or your preferred MySQL server.

5. **Create database and apply migrations**

```bash
# Create the database
node scripts/setup-db.js

# Apply migrations
npx prisma migrate dev
```

6. **Seed the database**

```bash
node scripts/seed.js
```

This will create test users, projects, tasks, and other data for development.

Test user credentials:
- Admin: admin@example.com / password123
- Manager: manager@example.com / password123
- User: user1@example.com / password123
- Designer: designer@example.com / password123
- Tester: tester@example.com / password123

7. **Build and start the application**

For development:
```bash
npm run dev
```

For production:
```bash
npm run build
npm run start
```

The application will be available at http://localhost:3000.

## Project Structure

- `/app` - Next.js App Router
  - `/api` - Backend API endpoints
  - `/(auth)` - Authentication pages (login, register)
  - `/dashboard` - Main dashboard
  - `/projects` - Project management
  - `/tasks` - Task management
  - `/team` - Team management
  - `/attendance` - Attendance tracking
  - `/profile` - User profile
  - `/analytics` - Data visualization
  - `/calendar` - Event calendar
  - `/offline` - Offline fallback page
- `/components` - Reusable UI components
  - `/ui` - shadcn/ui components
  - `/forms` - Form components
  - `/layouts` - Layout components
  - `/data-display` - Tables, charts, etc.
- `/hooks` - Custom React hooks
- `/lib` - Utility functions and shared code
  - `/api` - API client functions
  - `/auth` - Authentication utilities
  - `/permissions` - Permission system
  - `/services` - Business logic services
  - `/utils` - Helper functions
- `/prisma` - Prisma schema and migrations
- `/public` - Static assets and PWA files
- `/scripts` - Database setup and seeding scripts

## Database Structure

The application uses a MySQL database with Prisma ORM for data modeling and access. Below is an overview of the key models and their relationships.

### Core Models

#### User
- **Fields**: id, name, email, password, role, bio, jobTitle, location, department, phone, skills
- **Role Values**: "admin", "manager", "user", "guest"
- **Relations**: Projects, Tasks, TeamMembers, Attendance, Documents, Comments, Roles, Permissions

#### Role
- **Fields**: id, name, description, color
- **Relations**: Permissions (many-to-many), Users
- **Features**: Customizable roles with assigned permissions

#### Permission
- **Fields**: id, name, description, category
- **Relations**: Roles (many-to-many)
- **Features**: Granular access control for system features

#### Project
- **Fields**: id, title, description, startDate, endDate, dueDate, estimatedTime, totalTimeSpent
- **Relations**: User (creator), Tasks, TeamMembers, Events, ProjectStatuses
- **Features**: Custom status workflows, team collaboration

#### Task
- **Fields**: id, title, description, priority, statusId, dueDate, projectId, parentId, order
- **Priority Values**: "low", "medium", "high"
- **Relations**: Project, User (assignees), Comments, Attachments, Subtasks
- **Features**: Nested subtasks with ordering, multiple assignees

#### ProjectStatus
- **Fields**: id, name, color, description, isDefault, order, projectId
- **Features**: Custom statuses per project, ordering, visual customization

#### Attendance
- **Fields**: id, userId, checkInTime, checkOutTime, checkInLatitude, checkInLongitude, checkInLocationName, totalHours
- **Relations**: User, Project (optional), Task (optional)
- **Features**: Geolocation tracking, offline support

#### AttendanceSettings
- **Fields**: id, userId, workHoursPerDay, workDays, reminderEnabled, reminderTime, autoCheckoutEnabled, autoCheckoutTime
- **Relations**: User
- **Features**: Customizable work hours, auto-checkout, reminders

### Authentication Models (NextAuth.js)

- **Account**: Social login connections (Google, Facebook)
- **Session**: Active user sessions
- **VerificationToken**: Email verification

### Additional Models

- **TeamMember**: Project team membership
- **Comment**: Task comments
- **Document**: File attachments
- **Event**: Project events and milestones
- **Activity**: System activity logs
- **TaskAssignee**: Many-to-many relationship between tasks and users
- **TaskAttachment**: Files attached to tasks
- **RolePermission**: Many-to-many relationship between roles and permissions
- **AttendanceCorrectionRequest**: Requests to correct attendance records

## Key Features

### Authentication & Authorization

- **Social Login**: Google and Facebook integration
- **Email/Password**: Traditional authentication
- **Role-Based Access**: Different permissions for admin, manager, user, and guest roles
- **Database-Backed Permissions**: Fully dynamic permission system stored in database
- **Permission Management UI**: Create, edit, and assign permissions through the admin interface

### Project Management

- **Project Dashboard**: Overview of project status, team, and progress
- **Team Management**: Add/remove team members
- **Status Customization**: Create and manage custom project statuses
- **Analytics**: Project progress and resource allocation charts

### Task Management

- **Kanban Board**: Drag-and-drop interface for task management
- **List View**: Alternative view with grouping and filtering
- **Subtasks**: Nested task hierarchy with ordering
- **Comments & Attachments**: Team collaboration on tasks
- **Time Tracking**: Estimate and track time spent on tasks

### Attendance System

- **Check-in/Check-out**: Track work hours with geolocation and location name display
- **Offline Support**: Continue using attendance features without internet connection
- **Background Sync**: Automatically synchronize offline attendance actions when back online
- **Analytics**: Comprehensive attendance reports and statistics with filtering options
- **Auto-checkout**: Configurable automatic checkout for users who forget to check out
- **Correction Requests**: System for requesting and approving attendance corrections
- **Settings**: Customize work hours, work days, reminders, and auto-checkout options

### User Profile

- **Profile Management**: Update personal information and preferences
- **Activity History**: View past actions and contributions
- **Skills & Expertise**: Showcase professional capabilities

### Offline Capabilities

- **Service Worker**: Cache essential resources
- **Background Sync**: Queue actions when offline
- **PWA Features**: Installable on devices

## API Routes

The application provides a comprehensive API for all functionality:

- `/api/auth/*` - Authentication (NextAuth.js)
- `/api/projects/*` - Project management
- `/api/tasks/*` - Task management
- `/api/users/*` - User management
- `/api/attendance/*` - Attendance tracking, settings, and correction requests
- `/api/permissions/*` - Permission and role management
- `/api/team-management/*` - Team management
- `/api/activities/*` - Activity logging
- `/api/dashboard/*` - Dashboard statistics

## Building and Deployment

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run start
```

### Database Management

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate dev

# Reset database
npm run db-reset

# Seed database
npm run seed
```

## TypeScript and ESLint

The project uses TypeScript for type safety and ESLint for code quality. You can enable strict checking in the build process by modifying `next.config.mjs`:

```javascript
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // other config...
}
```

## Performance Optimizations

- **SWR**: Smart data fetching with caching and revalidation
- **Code Splitting**: Automatic code splitting by Next.js
- **Image Optimization**: Optimized image loading
- **Service Worker**: Caching for offline support and faster loads

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Android Chrome
- **PWA Support**: Installable on compatible devices

## License

[MIT](LICENSE)
