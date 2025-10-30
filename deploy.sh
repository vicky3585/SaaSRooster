#!/bin/bash

# Bizverse Deployment Script
# This script automates the deployment process after pulling updates from GitHub

set -e  # Exit on any error

echo "🚀 Starting Bizverse Deployment..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="/home/ubuntu/code_artifacts/bizverse"
LOG_FILE="/tmp/bizverse-deploy-$(date +%Y%m%d-%H%M%S).log"

cd "$PROJECT_DIR" || exit 1

echo -e "${YELLOW}Step 1: Stopping application...${NC}"
pkill -f "tsx server/index.ts" || pkill -f "node.*bizverse" || echo "No running process found"
sleep 2

echo -e "${YELLOW}Step 2: Pulling latest changes from GitHub...${NC}"
git pull origin main 2>&1 | tee -a "$LOG_FILE"

# Pull submodule changes if exists
if [ -d "SaaSRooster" ]; then
    echo -e "${YELLOW}Step 3: Pulling submodule changes...${NC}"
    cd SaaSRooster
    git pull origin main 2>&1 | tee -a "$LOG_FILE"
    cd ..
fi

echo -e "${YELLOW}Step 4: Installing/updating dependencies...${NC}"
npm install 2>&1 | tee -a "$LOG_FILE"

echo -e "${YELLOW}Step 5: Running database migrations...${NC}"
npm run db:push 2>&1 | tee -a "$LOG_FILE" || echo "Database migration skipped or failed (non-critical)"

echo -e "${YELLOW}Step 6: Starting PostgreSQL (if not running)...${NC}"
sudo service postgresql start 2>&1 || echo "PostgreSQL already running or service not available"

echo -e "${YELLOW}Step 7: Starting application...${NC}"
nohup npm run dev > /tmp/bizverse.log 2>&1 &
APP_PID=$!
echo "Application started with PID: $APP_PID"

# Wait for application to start
echo "Waiting for application to start..."
for i in {1..15}; do
    sleep 1
    if lsof -i :5000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Application is running on port 5000${NC}"
        break
    fi
    if [ $i -eq 15 ]; then
        echo -e "${RED}✗ Application failed to start within 15 seconds${NC}"
        echo "Check logs at /tmp/bizverse.log"
        exit 1
    fi
done

echo ""
echo -e "${GREEN}=================================="
echo "✅ Deployment Successful!"
echo "==================================${NC}"
echo ""
echo "📊 Application Status:"
echo "  - URL: http://localhost:5000"
echo "  - Admin URL: http://localhost:5000/admin/login"
echo "  - Logs: /tmp/bizverse.log"
echo "  - Deployment Log: $LOG_FILE"
echo ""
echo "🔐 Admin Credentials:"
echo "  - Email: hugenetwork7@gmail.com"
echo "  - Password: admin123"
echo ""
echo "📝 Useful Commands:"
echo "  - View live logs: tail -f /tmp/bizverse.log"
echo "  - Check process: ps aux | grep tsx"
echo "  - Stop application: pkill -f 'tsx server/index.ts'"
echo ""
