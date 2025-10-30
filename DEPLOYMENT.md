# Bizverse Deployment Guide

## 🚀 Quick Start - Deploy After GitHub Update

When you push updates to GitHub and want to deploy them to your Ubuntu machine:

```bash
cd /home/ubuntu/code_artifacts/bizverse
./deploy.sh
```

That's it! The script will automatically:
- Stop the running application
- Pull latest changes from GitHub
- Install dependencies
- Run database migrations
- Restart the application

---

## 📋 Manual Deployment Steps

If you prefer to deploy manually or need more control:

### 1. Navigate to Project Directory
```bash
cd /home/ubuntu/code_artifacts/bizverse
```

### 2. Stop Running Application
```bash
pkill -f "tsx server/index.ts"
# or
pkill -f "node.*bizverse"
```

### 3. Pull Latest Changes
```bash
# Pull main project
git pull origin main

# Pull submodule (if you have SaaSRooster)
cd SaaSRooster
git pull origin main
cd ..
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Run Database Migrations
```bash
npm run db:push
```

### 6. Start Application
```bash
# Development mode
npm run dev > /tmp/bizverse.log 2>&1 &

# OR Production mode
npm run build
npm start > /tmp/bizverse.log 2>&1 &
```

---

## 🔍 Checking Application Status

### Check if Application is Running
```bash
# Check port 5000
lsof -i :5000

# Check process
ps aux | grep tsx
```

### View Live Logs
```bash
tail -f /tmp/bizverse.log
```

### Test Application
```bash
# Check if server responds
curl http://localhost:5000

# Or open in browser
xdg-open http://localhost:5000
```

---

## 🗄️ Database Management

### PostgreSQL Commands

#### Start PostgreSQL
```bash
sudo service postgresql start
```

#### Stop PostgreSQL
```bash
sudo service postgresql stop
```

#### Restart PostgreSQL
```bash
sudo service postgresql restart
```

#### Access PostgreSQL
```bash
sudo -u postgres psql -d bizverse_db
```

### Database Backup
```bash
# Backup database
sudo -u postgres pg_dump bizverse_db > backup_$(date +%Y%m%d).sql

# Restore database
sudo -u postgres psql bizverse_db < backup_20241030.sql
```

---

## 🔐 Admin Account Management

### Admin Credentials
- **Email**: hugenetwork7@gmail.com
- **Password**: admin123
- **Admin URL**: http://localhost:5000/admin/login

### Create/Reset Admin Account
```bash
cd /home/ubuntu/code_artifacts/bizverse
npx tsx server/scripts/createPlatformAdmin.ts
```

### Initialize Subscription Plans
```bash
npx tsx server/scripts/initSubscriptionPlans.ts
```

---

## 🌐 Production Deployment (with PM2)

For production, it's recommended to use PM2 for process management:

### Install PM2
```bash
sudo npm install -g pm2
```

### Start Application with PM2
```bash
cd /home/ubuntu/code_artifacts/bizverse
pm2 start npm --name "bizverse" -- run dev

# OR for production
pm2 start npm --name "bizverse" -- start
```

### PM2 Commands
```bash
# View status
pm2 status

# View logs
pm2 logs bizverse

# Restart
pm2 restart bizverse

# Stop
pm2 stop bizverse

# Auto-start on system reboot
pm2 startup
pm2 save
```

### PM2 Deployment Script
```bash
cd /home/ubuntu/code_artifacts/bizverse
git pull origin main
npm install
npm run db:push
pm2 restart bizverse
```

---

## 🌍 Setting Up with Your Domain (bizverse.in)

### Step 1: Install Nginx
```bash
sudo apt-get update
sudo apt-get install -y nginx
```

### Step 2: Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/bizverse
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name bizverse.in www.bizverse.in;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 3: Enable the Site
```bash
sudo ln -s /etc/nginx/sites-available/bizverse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 4: Configure DNS on Hostinger
1. Go to Hostinger DNS management
2. Add/Update these records:
   - **A Record**: `@` pointing to your Ubuntu machine's public IP
   - **A Record**: `www` pointing to your Ubuntu machine's public IP

### Step 5: Install SSL Certificate (Let's Encrypt)
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d bizverse.in -d www.bizverse.in
```

---

## 🐛 Troubleshooting

### Application Won't Start

**Check if port 5000 is in use:**
```bash
lsof -i :5000
# If something is using it, kill it:
kill -9 <PID>
```

**Check logs:**
```bash
tail -50 /tmp/bizverse.log
```

### Database Connection Issues

**Check if PostgreSQL is running:**
```bash
sudo service postgresql status
```

**Test database connection:**
```bash
sudo -u postgres psql -d bizverse_db -c "SELECT 1;"
```

**Check database URL in .env:**
```bash
cat /home/ubuntu/code_artifacts/bizverse/.env | grep DATABASE_URL
```

### Git Pull Conflicts

**Reset to GitHub version:**
```bash
cd /home/ubuntu/code_artifacts/bizverse
git fetch origin
git reset --hard origin/main
```

**Stash local changes:**
```bash
git stash --include-untracked
git pull origin main
```

### Permission Issues

**Fix file permissions:**
```bash
sudo chown -R $USER:$USER /home/ubuntu/code_artifacts/bizverse
chmod +x /home/ubuntu/code_artifacts/bizverse/deploy.sh
```

---

## 📊 Application URLs

- **Main Application**: http://localhost:5000
- **User Login**: http://localhost:5000/login
- **User Signup**: http://localhost:5000/signup
- **Admin Login**: http://localhost:5000/admin/login
- **Admin Dashboard**: http://localhost:5000/admin

---

## 🔄 Update Workflow

### Recommended Workflow:

1. **Make changes locally or via GitHub**
2. **Commit and push to GitHub**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

3. **Deploy on Ubuntu server**
   ```bash
   ssh your-server
   cd /home/ubuntu/code_artifacts/bizverse
   ./deploy.sh
   ```

4. **Verify deployment**
   - Check logs: `tail -f /tmp/bizverse.log`
   - Test in browser: http://localhost:5000
   - Test admin: http://localhost:5000/admin/login

---

## 📝 Environment Variables

Key environment variables in `.env`:

```env
# Database
DATABASE_URL=postgresql://bizverse_user:bizverse_secure_password_2024@localhost:5432/bizverse_db

# Application
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=your-jwt-secret-key-change-in-production

# Admin
SUPPORT_EMAIL=hugenetwork7@gmail.com

# Payment (PayUMoney)
PAYUMONEY_KEY=your-key
PAYUMONEY_SALT=your-salt
PAYUMONEY_MODE=test

# Email (Resend API)
RESEND_API_KEY=your-resend-key
```

---

## 🎯 Features Checklist

- ✅ JWT-based Authentication
- ✅ Multi-tenant Organization System
- ✅ Subscription Management (Free, Basic, Pro, Enterprise)
- ✅ Admin Panel for Managing Organizations
- ✅ Admin Can Change Plans & Extend Validity
- ✅ Subscription Expiry Date on Dashboard
- ✅ Rate Limiting for Security
- ✅ PayUMoney Integration (ready)
- ✅ Resend Email API (ready)
- ✅ PostgreSQL Database
- ✅ Docker Support
- ✅ Professional UI/UX

---

## 📞 Support

For issues or questions:
- Email: hugenetwork7@gmail.com
- Check logs: `/tmp/bizverse.log`
- GitHub Issues: [Your Repository]

---

## 📚 Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

---

**Last Updated**: October 30, 2024
