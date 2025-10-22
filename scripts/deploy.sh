#!/bin/bash
set -e

echo "🚀 Bizverse SaaS - Docker Deployment Script"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose first: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found, creating from .env.example${NC}"
    cp .env.example .env
    echo -e "${RED}⚠️  Please edit .env with your configuration before deploying!${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Checking configuration...${NC}"

# Check critical environment variables
if ! grep -q "JWT_SECRET=" .env || grep -q "JWT_SECRET=your_jwt_secret" .env; then
    echo -e "${RED}❌ Please set JWT_SECRET in .env${NC}"
    exit 1
fi

if ! grep -q "DATABASE_URL=" .env; then
    echo -e "${RED}❌ Please set DATABASE_URL in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Configuration OK${NC}"
echo ""

# Stop existing containers
echo -e "${BLUE}🛑 Stopping existing containers...${NC}"
docker-compose down 2>/dev/null || true

echo ""
echo -e "${BLUE}🏗️  Building Docker images...${NC}"
docker-compose build --no-cache

echo ""
echo -e "${BLUE}🚀 Starting services...${NC}"
docker-compose up -d

echo ""
echo -e "${BLUE}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Services are running!${NC}"
else
    echo -e "${RED}❌ Services failed to start${NC}"
    echo "Check logs: docker-compose logs"
    exit 1
fi

echo ""
echo -e "${BLUE}🗄️  Initializing database...${NC}"
docker-compose exec -T app npm run db:push

echo ""
echo -e "${BLUE}👤 Creating admin user...${NC}"
docker-compose exec -T app npx tsx server/scripts/createPlatformAdmin.ts

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Services running:"
echo "  📱 Application: http://localhost:5000"
echo "  🗄️  PostgreSQL: localhost:5432"
echo ""
echo "Admin login:"
echo "  URL: http://localhost:5000/admin/login"
echo "  Email: hugenetwork7@gmail.com"
echo "  Password: ADMIN_PASSWORD_PLACEHOLDER"
echo ""
echo "Useful commands:"
echo "  View logs:    docker-compose logs -f"
echo "  Stop:         docker-compose down"
echo "  Restart:      docker-compose restart"
echo "  Shell:        docker-compose exec app sh"
echo ""
echo -e "${YELLOW}⚠️  Remember to change the admin password after first login!${NC}"
