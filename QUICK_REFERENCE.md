# Bizverse Quick Reference Guide

## 🚀 Common Tasks

### Deploy Updates from GitHub
```bash
cd /home/ubuntu/code_artifacts/bizverse && ./deploy.sh
```

### Start Application
```bash
cd /home/ubuntu/code_artifacts/bizverse
npm run dev > /tmp/bizverse.log 2>&1 &
```

### Stop Application
```bash
pkill -f "tsx server/index.ts"
```

### View Logs
```bash
tail -f /tmp/bizverse.log
```

### Check if Running
```bash
lsof -i :5000
```

### Restart PostgreSQL
```bash
sudo service postgresql restart
```

### Create Admin Account
```bash
cd /home/ubuntu/code_artifacts/bizverse
npx tsx server/scripts/createPlatformAdmin.ts
```

### Database Backup
```bash
sudo -u postgres pg_dump bizverse_db > backup_$(date +%Y%m%d).sql
```

## 🔗 Quick Links

- **Application**: http://localhost:5000
- **Admin Login**: http://localhost:5000/admin/login
- **Admin Email**: hugenetwork7@gmail.com
- **Admin Password**: admin123

## 🐛 Quick Fixes

### App Won't Start
```bash
pkill -f "tsx server/index.ts"
sudo service postgresql start
cd /home/ubuntu/code_artifacts/bizverse
npm run dev > /tmp/bizverse.log 2>&1 &
```

### Database Error
```bash
sudo service postgresql restart
cd /home/ubuntu/code_artifacts/bizverse
npm run db:push
```

### Git Conflicts
```bash
cd /home/ubuntu/code_artifacts/bizverse
git fetch origin
git reset --hard origin/main
```

## 📁 Important Files

- **Environment**: `/home/ubuntu/code_artifacts/bizverse/.env`
- **Logs**: `/tmp/bizverse.log`
- **Deploy Script**: `/home/ubuntu/code_artifacts/bizverse/deploy.sh`
- **Database Config**: `DATABASE_URL` in `.env`

## 🔄 Full Restart
```bash
pkill -f "tsx server/index.ts"
sudo service postgresql restart
cd /home/ubuntu/code_artifacts/bizverse
git pull origin main
npm install
npm run db:push
npm run dev > /tmp/bizverse.log 2>&1 &
```
