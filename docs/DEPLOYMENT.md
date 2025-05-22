# Production Deployment Guide

This comprehensive guide provides step-by-step instructions for deploying the Project Management application on an AlmaLinux VPS using PM2 and OpenLiteSpeed.

## 📋 Prerequisites

Before starting the deployment, ensure you have:

- **AlmaLinux VPS** with root or sudo access
- **Node.js v22.x** installed
- **MySQL server** installed and running
- **Git** installed
- **OpenLiteSpeed** web server installed
- **PM2** installed globally (`npm install -g pm2`)

## 🚀 Quick Deployment

For experienced users, here's the quick deployment command sequence:

```bash
# Clone and setup
git clone https://github.com/rafidalwahid/next.js_project_management.git
cd next.js_project_management
npm install

# Configure environment and database
cp .env.example .env.production
# Edit .env.production with your settings
npm run setup-production

# Build and deploy
npm run build
pm2 start npm --name "project-management" -- start
pm2 startup && pm2 save
```

## 📖 Detailed Deployment Steps

### Step 1: System Preparation

#### 1.1 Update System
```bash
sudo dnf update -y
```

#### 1.2 Install Node.js v22.x
```bash
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs
node --version  # Should show v22.x
```

#### 1.3 Install PM2 Globally
```bash
npm install -g pm2
pm2 --version
```

### Step 2: Clone and Setup Project

#### 2.1 Clone Repository
```bash
git clone https://github.com/rafidalwahid/next.js_project_management.git
cd next.js_project_management
```

#### 2.2 Install Dependencies
```bash
npm install
```

### Step 3: Environment Configuration

#### 3.1 Create Production Environment File
```bash
cp .env.example .env.production
```

#### 3.2 Configure Environment Variables
Edit the `.env.production` file:

```bash
nano .env.production
```

**Required Configuration:**
```env
# Database Configuration
DATABASE_URL="mysql://db_user:your_secure_password@localhost:3306/project_management"

# NextAuth Configuration
NEXTAUTH_SECRET="your-super-secure-secret-key-min-32-chars"
NEXTAUTH_URL="https://yourdomain.com"

# Application Environment
NODE_ENV="production"
PORT=3000

# Optional: File Upload Configuration
UPLOAD_DIR="/var/www/uploads"
MAX_FILE_SIZE=10485760

# Optional: Email Configuration (if using email features)
SMTP_HOST="your-smtp-host"
SMTP_PORT=587
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-email-password"
```

**Security Notes:**
- Use a strong, unique `NEXTAUTH_SECRET` (minimum 32 characters)
- Use a secure database password
- Update `NEXTAUTH_URL` to your actual domain

### Step 4: Database Setup

#### 4.1 Create MySQL Database and User
```bash
mysql -u root -p
```

Execute the following SQL commands:
```sql
-- Create database
CREATE DATABASE project_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user with secure password
CREATE USER 'db_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON project_management.* TO 'db_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify user creation
SELECT User, Host FROM mysql.user WHERE User = 'db_user';

-- Exit MySQL
EXIT;
```

#### 4.2 Test Database Connection
```bash
mysql -u db_user -p project_management
```

### Step 5: Application Setup

#### 5.1 Run Production Setup Script
This automated script handles:
- Database schema migration
- Prisma client generation
- Initial data seeding
- Permission setup

```bash
npm run setup-production
```

#### 5.2 Build Application
```bash
npm run build
```

### Step 6: PM2 Deployment

#### 6.1 Start Application with PM2
```bash
pm2 start npm --name "project-management" -- start
```

#### 6.2 Configure PM2 for Auto-Restart
```bash
# Setup PM2 to start on system boot
pm2 startup

# Save current PM2 configuration
pm2 save
```

#### 6.3 Verify PM2 Status
```bash
pm2 status
pm2 logs project-management
```

### Step 7: OpenLiteSpeed Configuration

#### 7.1 Access OpenLiteSpeed Admin Panel
Open your browser and navigate to:
```
https://your-server-ip:7080
```

#### 7.2 Create Virtual Host
1. Go to **Virtual Hosts** → **Add**
2. Configure the virtual host:
   - **Virtual Host Name**: `project-management`
   - **Virtual Host Root**: `/var/www/project-management/`
   - **Config File**: `$SERVER_ROOT/conf/vhosts/project-management/vhconf.conf`
   - **Enable Scripts/ExtApps**: Yes

#### 7.3 Configure Proxy Settings
1. Go to **Script Handler** → **Add**
2. Set up Node.js proxy:
   - **Suffixes**: `*`
   - **Type**: `Proxy`
   - **URI**: `http://localhost:3000/`

#### 7.4 Configure Domain Mapping
1. Go to **Listeners** → **Default HTTP Listener**
2. Add **Virtual Host Mappings**:
   - **Virtual Host**: `project-management`
   - **Domain**: `yourdomain.com` or `*`

#### 7.5 SSL Configuration (Recommended)
1. Go to **SSL** tab in your virtual host
2. Configure SSL certificate:
   - **Private Key File**: `/path/to/private.key`
   - **Certificate File**: `/path/to/certificate.crt`
   - **Certificate Chain**: `/path/to/ca-bundle.crt`

#### 7.6 Restart OpenLiteSpeed
```bash
sudo systemctl restart lsws
```

## 🔧 Troubleshooting

### Database Connection Issues

**Problem**: Database connection errors
**Solutions**:

1. **Verify credentials**:
   ```bash
   cat .env.production | grep DATABASE_URL
   ```

2. **Test MySQL connection**:
   ```bash
   mysql -u db_user -p project_management
   ```

3. **Check MySQL service**:
   ```bash
   sudo systemctl status mysqld
   sudo systemctl start mysqld  # if not running
   ```

4. **Verify user permissions**:
   ```sql
   SHOW GRANTS FOR 'db_user'@'localhost';
   ```

### PM2 Issues

**Problem**: Application won't start with PM2
**Solutions**:

1. **Check PM2 logs**:
   ```bash
   pm2 logs project-management --lines 50
   ```

2. **Test without PM2**:
   ```bash
   NODE_ENV=production npm start
   ```

3. **Restart PM2 daemon**:
   ```bash
   pm2 kill
   pm2 start npm --name "project-management" -- start
   ```

4. **Check port availability**:
   ```bash
   netstat -tlnp | grep :3000
   ```

### Build Issues

**Problem**: Build process fails
**Solutions**:

1. **Clear cache and rebuild**:
   ```bash
   rm -rf .next node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Check TypeScript errors**:
   ```bash
   npm run type-check
   ```

3. **Verify Prisma client**:
   ```bash
   npx prisma generate
   ```

### OpenLiteSpeed Issues

**Problem**: OpenLiteSpeed not serving the application
**Solutions**:

1. **Check OpenLiteSpeed status**:
   ```bash
   sudo systemctl status lsws
   ```

2. **Verify proxy configuration**:
   - Ensure proxy URI points to `http://localhost:3000`
   - Check that PM2 application is running on port 3000

3. **Check OpenLiteSpeed logs**:
   ```bash
   tail -f /usr/local/lsws/logs/error.log
   tail -f /usr/local/lsws/logs/access.log
   ```

## 🔄 Maintenance & Operations

### Application Updates

**Standard Update Process**:
```bash
# 1. Backup database
mysqldump -u db_user -p project_management > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Pull latest changes
git pull origin main

# 3. Install new dependencies
npm install

# 4. Run database migrations (if any)
npx prisma migrate deploy

# 5. Rebuild application
npm run build

# 6. Restart PM2 process
pm2 restart project-management

# 7. Verify deployment
pm2 status
pm2 logs project-management --lines 20
```

### Database Management

**Regular Backups**:
```bash
# Create automated backup script
cat > /home/backup_db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mysqldump -u db_user -p'your_password' project_management > $BACKUP_DIR/project_management_$DATE.sql
# Keep only last 7 days of backups
find $BACKUP_DIR -name "project_management_*.sql" -mtime +7 -delete
EOF

chmod +x /home/backup_db.sh

# Add to crontab for daily backups at 2 AM
echo "0 2 * * * /home/backup_db.sh" | crontab -
```

**Database Restore**:
```bash
mysql -u db_user -p project_management < backup_file.sql
```

### Monitoring & Performance

**PM2 Monitoring**:
```bash
# Real-time monitoring
pm2 monit

# Process information
pm2 show project-management

# Resource usage
pm2 status
```

**System Monitoring**:
```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check network connections
netstat -tlnp
```

### Log Management

**Application Logs**:
```bash
# PM2 logs
pm2 logs project-management
pm2 logs project-management --lines 100

# Rotate PM2 logs
pm2 install pm2-logrotate
```

**System Logs**:
```bash
# OpenLiteSpeed logs
tail -f /usr/local/lsws/logs/error.log
tail -f /usr/local/lsws/logs/access.log

# System logs
journalctl -u lsws -f
```

## 🔐 Security Considerations

### Environment Security
- Store sensitive data in environment variables
- Use strong passwords for database users
- Regularly update `NEXTAUTH_SECRET`
- Enable SSL/TLS for production

### File Permissions
```bash
# Set proper permissions for application files
chown -R www-data:www-data /var/www/project-management
chmod -R 755 /var/www/project-management
chmod 600 .env.production
```

### Firewall Configuration
```bash
# Allow only necessary ports
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=7080/tcp  # OpenLiteSpeed admin
sudo firewall-cmd --reload
```

## 📚 Additional Resources

- **[Next.js Production Deployment](https://nextjs.org/docs/deployment)**
- **[PM2 Production Guide](https://pm2.keymetrics.io/docs/usage/quick-start/)**
- **[OpenLiteSpeed Documentation](https://openlitespeed.org/kb/)**
- **[Prisma Production Guide](https://www.prisma.io/docs/guides/deployment)**
- **[MySQL Security Guide](https://dev.mysql.com/doc/refman/8.0/en/security-guidelines.html)**

## 🆘 Support

If you encounter issues not covered in this guide:

1. **Check application logs**: `pm2 logs project-management`
2. **Review OpenLiteSpeed logs**: `/usr/local/lsws/logs/`
3. **Verify system resources**: `htop`, `df -h`, `free -h`
4. **Test database connectivity**: `mysql -u db_user -p`
5. **Validate environment configuration**: Check `.env.production`

For additional support, please refer to the project's GitHub repository or documentation.
