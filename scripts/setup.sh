#!/bin/bash
set -e

echo "🚀 Bizverse SaaS - Setup Script"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create .env file from .env.example"
    echo "  cp .env.example .env"
    exit 1
fi

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo ""
echo -e "${BLUE}🗄️  Setting up database...${NC}"
npm run db:push

echo ""
echo -e "${BLUE}👤 Creating platform admin...${NC}"
npx tsx server/scripts/createPlatformAdmin.ts

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review and update .env file with your API keys"
echo "  2. Start development server: npm run dev"
echo "  3. Build for production: npm run build"
echo "  4. Start production server: npm start"
echo ""
echo "Admin login:"
echo "  URL: http://localhost:5000/admin/login"
echo "  Email: hugenetwork7@gmail.com"
echo "  Password: ADMIN_PASSWORD_PLACEHOLDER"
echo ""
echo "⚠️  Remember to change the admin password after first login!"
