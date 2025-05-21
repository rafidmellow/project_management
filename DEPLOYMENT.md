# Production Deployment Guide

This guide provides step-by-step instructions for deploying the Project Management application on an AlmaLinux VPS using PM2.

## Prerequisites

- AlmaLinux VPS with Node.js v22.x installed
- MySQL server installed and running
- Git installed
- PM2 installed globally (`npm install -g pm2`)

## Step 1: Clone the Repository

```bash
git clone https://github.com/rafidalwahid/next.js_project_management.git
cd next.js_project_management
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Configure Environment Variables

1. Update the `.env.production` file with your database credentials:

```
# Database
DATABASE_URL="mysql://db_user:your_password@localhost:3306/project_management"

# NextAuth
NEXTAUTH_SECRET="this-is-a-secret-key-for-jwt-authentication-123456789"
NEXTAUTH_URL="http://pm.erpcloud.app"

# Node environment
NODE_ENV="production"
```

Make sure to replace `your_password` with the actual password for the `db_user` MySQL user.

## Step 4: Set Up the Database

Create a MySQL user and database:

```bash
mysql -u root -p
```

In the MySQL prompt:

```sql
CREATE DATABASE project_management;
CREATE USER 'db_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON project_management.* TO 'db_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 5: Run the Production Setup Script

This script will:
- Set up the database
- Generate the Prisma client
- Run database migrations
- Seed the database with initial data

```bash
npm run setup-production
```

## Step 6: Build the Application

```bash
npm run build
```

## Step 7: Start the Application with PM2

```bash
pm2 start npm --name "project-management" -- start
```

To ensure the application starts on system reboot:

```bash
pm2 startup
pm2 save
```

## Step 8: Configure Nginx (Optional)

If you're using Nginx as a reverse proxy:

```bash
sudo nano /etc/nginx/conf.d/project-management.conf
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name pm.erpcloud.app;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then restart Nginx:

```bash
sudo systemctl restart nginx
```

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify the database credentials in `.env.production`
2. Check that the MySQL user has the correct permissions:

```sql
SHOW GRANTS FOR 'db_user'@'localhost';
```

3. Make sure MySQL is running:

```bash
sudo systemctl status mysql
```

### Prisma Client Generation Issues

If Prisma client generation fails:

```bash
npx prisma generate
```

### Build Issues

If the build process fails:

1. Check for any TypeScript errors:

```bash
npm run type-check
```

2. Make sure all dependencies are installed:

```bash
npm install
```

3. Try running the build script directly:

```bash
node scripts/build.js
```

### PM2 Issues

If the application doesn't start with PM2:

1. Check the PM2 logs:

```bash
pm2 logs project-management
```

2. Try starting the application without PM2 to see any errors:

```bash
npm start
```

## Maintenance

### Updating the Application

To update the application:

```bash
git pull
npm install
npm run build
pm2 restart project-management
```

### Database Backups

To backup the database:

```bash
mysqldump -u root -p project_management > backup_$(date +%Y%m%d).sql
```

### Monitoring

Monitor the application using PM2:

```bash
pm2 monit
```

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
