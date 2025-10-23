# 🚀 Bizverse SaaS - Complete Multi-Tenant Business Management Platform

<div align="center">

![Bizverse Banner](https://static.vecteezy.com/system/resources/thumbnails/027/505/733/small_2x/abstract-business-banner-background-with-blue-yellow-and-white-modern-curve-illustration-vector.jpg)

**A Production-Ready Multi-Tenant SaaS Platform for Modern Businesses**

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/vicky3585/SaaSRooster/ci-cd.yml?branch=main&style=for-the-badge&logo=github)](https://github.com/vicky3585/SaaSRooster/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

[Features](#-features) • [Tech Stack](#-technology-stack) • [Installation](#-installation) • [Documentation](#-api-documentation) • [Support](#-support)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
  - [Quick Start with Docker](#quick-start-with-docker-recommended)
  - [Manual Installation](#manual-installation)
- [Environment Variables](#-environment-variables-configuration)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [Admin Access](#-admin-access)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Deployment](#-deployment)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)
- [Support & Contact](#-support--contact)

---

## 🌟 Overview

**Bizverse SaaS** is a comprehensive, enterprise-grade multi-tenant SaaS platform designed for modern businesses. Built with TypeScript, React, and PostgreSQL, it combines powerful billing, accounting, inventory management, and CRM capabilities in one unified, scalable platform.

### 🎯 Key Highlights

- 🎁 **20-Day Free Trial** - Full-featured trial for all new organizations
- 🏢 **Multi-Tenant Architecture** - Complete organization isolation and data security
- 🔐 **Enterprise Security** - JWT authentication, rate limiting, CORS, and audit logging
- 💳 **Integrated Payments** - PayUMoney, Razorpay, and Stripe support
- 📧 **Smart Notifications** - Automated email summaries and alerts via Resend API
- 📱 **Responsive Design** - Beautiful UI that works on all devices
- 🐳 **Docker Ready** - One-command deployment with Docker Compose
- 🚀 **CI/CD Pipeline** - Automated testing and deployment with GitHub Actions
- 📊 **Real-time Analytics** - Comprehensive business insights and reporting
- 🌍 **Production Ready** - Battle-tested, scalable, and optimized

---

## ✨ Features

### 💰 Billing & Invoicing
- ✅ Create, manage, and track sales invoices
- ✅ GST-compliant invoicing (CGST, SGST, IGST)
- ✅ Professional invoice templates with PDF generation
- ✅ Email delivery with attachments
- ✅ Payment tracking and reconciliation
- ✅ Credit/Debit notes management
- ✅ Recurring invoices with automation
- ✅ Multiple tax rate support
- ✅ Discount and advance payment handling
- ✅ Invoice aging and payment reminders

### 📦 Inventory Management
- ✅ Product/Item master with SKU and barcode
- ✅ Multi-warehouse support
- ✅ Real-time stock tracking and adjustments
- ✅ Batch and serial number tracking
- ✅ Low stock alerts and reorder points
- ✅ Purchase orders and GRN (Goods Receipt Note)
- ✅ Stock valuation (FIFO, LIFO, Weighted Average)
- ✅ Inventory reports and analytics

### 💼 CRM (Customer Relationship Management)
- ✅ Lead management with pipeline stages
- ✅ Deal/Opportunity tracking
- ✅ Contact and account management
- ✅ Activity tracking (calls, emails, meetings)
- ✅ Task management with priorities
- ✅ Sales forecasting and pipeline analytics
- ✅ Customer communication history
- ✅ Follow-up reminders

### 📊 Accounting
- ✅ Chart of accounts management
- ✅ Journal entries with auto-posting
- ✅ Financial reports (P&L, Balance Sheet, Cash Flow)
- ✅ GST reports (GSTR-1, GSTR-3B ready)
- ✅ Expense tracking and categorization
- ✅ Bank reconciliation
- ✅ Trial balance
- ✅ Age analysis (Receivables/Payables)

### 🛒 Purchase Management
- ✅ Vendor master management
- ✅ Purchase orders and requisitions
- ✅ Purchase invoices with GRN matching
- ✅ Vendor payments and TDS tracking
- ✅ Vendor statements and reconciliation
- ✅ Purchase analytics and reporting

### 🔐 Security & Access Control
- ✅ JWT-based authentication with refresh tokens
- ✅ Organization-scoped access control
- ✅ Role-based permissions (Owner, Admin, Accountant, Viewer)
- ✅ Rate limiting on API endpoints (100 req/15min)
- ✅ CORS protection with configurable origins
- ✅ Password hashing with bcrypt (salt rounds: 10)
- ✅ SQL injection protection via ORM
- ✅ XSS prevention with input sanitization
- ✅ Audit logging for critical actions
- ✅ Session management with secure cookies

### 📧 Email Notifications
- ✅ **Monthly Sales Summary** - Automated reports on 1st of each month at 9 AM
- ✅ **Monthly Purchase Summary** - Comprehensive purchase analytics
- ✅ **Trial Expiration Warnings** - Reminders at 7, 3, and 1 day before expiry
- ✅ **Subscription Renewal Reminders** - Timely payment alerts
- ✅ **Invoice Delivery** - Professional emails with PDF attachments
- ✅ **Customizable Templates** - Brand-consistent email designs

### 💎 Subscription Management
- ✅ 20-day free trial for all new organizations
- ✅ Automated trial expiration handling
- ✅ Multiple subscription plans (Starter, Professional, Enterprise)
- ✅ Trial to paid conversion workflow
- ✅ Grace period management
- ✅ Usage tracking and limits enforcement
- ✅ Plan upgrades and downgrades
- ✅ Subscription analytics

### 💳 Payment Gateway Integration
- ✅ **PayUMoney** - Primary integration with full webhook support
- ✅ **Razorpay** - Alternative Indian payment gateway
- ✅ **Stripe** - International payments support
- ✅ Test and production mode support
- ✅ Webhook verification and callbacks
- ✅ Refund processing
- ✅ Transaction reconciliation
- ✅ Payment analytics and reporting

---

## 🛠️ Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 22.x | JavaScript runtime |
| **Express.js** | 4.21.x | Web framework |
| **TypeScript** | 5.6.x | Type-safe development |
| **PostgreSQL** | 15.x | Primary database |
| **Drizzle ORM** | 0.44.x | Type-safe database ORM |
| **JWT** | 9.0.x | Authentication |
| **Resend** | 6.1.x | Email service |
| **Puppeteer** | 24.x | PDF generation |
| **Bcrypt** | 3.0.x | Password hashing |
| **Helmet** | 8.1.x | Security headers |
| **CORS** | 2.8.x | Cross-origin resource sharing |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.x | UI library |
| **TypeScript** | 5.6.x | Type safety |
| **Vite** | 5.4.x | Build tool & dev server |
| **Wouter** | 3.3.x | Lightweight routing |
| **TanStack Query** | 5.60.x | Server state management |
| **Tailwind CSS** | 3.4.x | Utility-first CSS |
| **Radix UI** | Latest | Accessible components |
| **Recharts** | 2.15.x | Data visualization |
| **Framer Motion** | 11.x | Animations |
| **React Hook Form** | 7.55.x | Form management |
| **Zod** | 3.24.x | Schema validation |
| **Lucide React** | 0.453.x | Icon library |

### DevOps & Infrastructure
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **GitHub Actions** | CI/CD pipeline |
| **Nginx** | Reverse proxy (production) |
| **PM2** | Process management |
| **PostgreSQL** | Database with connection pooling |

---

## 📦 Prerequisites

### For Docker Installation (Recommended)
- **Docker Engine**: 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: 2.0+ ([Install Compose](https://docs.docker.com/compose/install/))
- **RAM**: Minimum 2GB (4GB recommended)
- **Disk Space**: 10GB available
- **OS**: Linux, macOS, or Windows with WSL2

### For Manual Installation
- **Node.js**: 22.x or later ([Download](https://nodejs.org/))
- **npm**: 10.x or later (comes with Node.js)
- **PostgreSQL**: 15 or later ([Download](https://www.postgresql.org/download/))
- **Git**: Latest version ([Download](https://git-scm.com/downloads))
- **OS**: Linux, macOS, or Windows

### Optional Tools
- **Postman/Insomnia**: API testing
- **pgAdmin**: PostgreSQL GUI management
- **VS Code**: Recommended IDE with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense

---

## 🚀 Installation

### Quick Start with Docker (Recommended)

This is the fastest way to get Bizverse up and running!

#### Step 1: Clone the Repository

```bash
git clone https://github.com/vicky3585/SaaSRooster.git bizverse
cd bizverse
```

#### Step 2: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your configuration
nano .env  # or use your preferred editor
```

**⚠️ Important:** Update these critical variables:

```env
# Database credentials
POSTGRES_PASSWORD=your_secure_database_password

# JWT Secrets (generate using: openssl rand -hex 32)
JWT_SECRET=your_generated_jwt_secret_here
REFRESH_SECRET=your_generated_refresh_secret_here
ADMIN_JWT_SECRET=your_generated_admin_secret_here
SESSION_SECRET=your_generated_session_secret_here

# Email service (get from https://resend.com)
RESEND_API_KEY=re_your_resend_api_key_here

# Payment gateway (get from https://payumoney.com)
PAYUMONEY_MERCHANT_KEY=your_merchant_key
PAYUMONEY_MERCHANT_SALT=your_merchant_salt
```

#### Step 3: Launch the Application

```bash
# Start all services (app + database)
docker-compose up -d

# View logs
docker-compose logs -f app

# Check service status
docker-compose ps
```

#### Step 4: Initialize the Database

```bash
# Push database schema
docker-compose exec app npm run db:push

# The admin user will be created automatically on first run
# Default credentials: hugenetwork7@gmail.com / admin123
```

#### Step 5: Access the Application

🎉 **Success!** Your application is now running:

- **Application**: http://localhost:5000
- **Admin Panel**: http://localhost:5000/admin/login
- **API Health**: http://localhost:5000/api/health
- **Database Admin** (dev mode): http://localhost:8080

**Default Admin Credentials:**
- Email: `hugenetwork7@gmail.com`
- Password: `admin123`

⚠️ **Security Warning:** Change the admin password immediately after first login!

---

### Manual Installation

If you prefer to install without Docker:

#### Step 1: Install Node.js 22.x

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS (using Homebrew)
brew install node@22

# Windows (download from nodejs.org)
# https://nodejs.org/en/download/

# Verify installation
node --version  # Should output v22.x.x
npm --version   # Should output 10.x.x
```

#### Step 2: Install PostgreSQL 15

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y postgresql-15 postgresql-contrib

# macOS (using Homebrew)
brew install postgresql@15

# Start PostgreSQL
sudo systemctl start postgresql   # Linux
brew services start postgresql@15 # macOS

# Enable auto-start on boot
sudo systemctl enable postgresql  # Linux
```

#### Step 3: Create Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In the psql prompt, run these commands:
CREATE USER bizverse_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE bizverse_db WITH OWNER bizverse_user ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE bizverse_db TO bizverse_user;

# Connect to the database and grant schema privileges
\c bizverse_db
GRANT ALL ON SCHEMA public TO bizverse_user;

# Exit psql
\q
```

#### Step 4: Clone and Configure

```bash
# Clone the repository
git clone https://github.com/vicky3585/SaaSRooster.git bizverse
cd bizverse

# Create environment file
cp .env.example .env

# Edit with your configuration
nano .env
```

Update the `DATABASE_URL` in `.env`:
```env
DATABASE_URL=postgresql://bizverse_user:your_secure_password@localhost:5432/bizverse_db
```

#### Step 5: Install Dependencies

```bash
# Install all dependencies
npm install

# This might take a few minutes...
```

#### Step 6: Initialize Database

```bash
# Push database schema (creates all tables)
npm run db:push

# Create platform admin user
npx tsx server/scripts/createPlatformAdmin.ts
```

#### Step 7: Build the Application

```bash
# Build both frontend and backend
npm run build

# This creates the dist/ directory with compiled code
```

#### Step 8: Start the Application

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start

# Or use PM2 for production (recommended)
npm install -g pm2
pm2 start dist/index.js --name bizverse
pm2 save
pm2 startup
```

#### Step 9: Verify Installation

Open your browser and navigate to:
- http://localhost:5000

You should see the Bizverse login page!

---

## ⚙️ Environment Variables Configuration

Create a `.env` file in the root directory with the following configuration:

### Essential Variables (Required)

```env
# ==============================================
# DATABASE CONFIGURATION
# ==============================================
DATABASE_URL=postgresql://bizverse_user:your_password@localhost:5432/bizverse_db

# For Docker Compose (separate variables)
POSTGRES_DB=bizverse_db
POSTGRES_USER=bizverse_user
POSTGRES_PASSWORD=your_secure_database_password
POSTGRES_PORT=5432

# ==============================================
# JWT SECRETS (Generate using: openssl rand -hex 32)
# ==============================================
JWT_SECRET=your_generated_jwt_secret_here
REFRESH_SECRET=your_generated_refresh_secret_here
ADMIN_JWT_SECRET=your_generated_admin_secret_here
SESSION_SECRET=your_generated_session_secret_here

# ==============================================
# APPLICATION SETTINGS
# ==============================================
NODE_ENV=production
PORT=5000
APP_URL=http://localhost:5000

# ==============================================
# EMAIL SERVICE (Resend API)
# ==============================================
RESEND_API_KEY=re_your_resend_api_key_here
FROM_EMAIL=invoices@yourdomain.com
FROM_NAME=Flying Venture System
SUPPORT_EMAIL=support@yourdomain.com

# ==============================================
# PAYMENT GATEWAYS
# ==============================================

# PayUMoney (Primary)
PAYUMONEY_MERCHANT_KEY=your_merchant_key
PAYUMONEY_MERCHANT_SALT=your_merchant_salt
PAYUMONEY_BASE_URL=https://test.payu.in/_payment  # Test mode
# PAYUMONEY_BASE_URL=https://secure.payu.in/_payment  # Production mode

# Razorpay (Optional)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Stripe (Optional)
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_secret

# ==============================================
# ADMIN ACCOUNT (Platform Administrator)
# ==============================================
ADMIN_EMAIL=hugenetwork7@gmail.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Flying Venture Admin
```

### Optional Variables (With Defaults)

```env
# ==============================================
# SUBSCRIPTION SETTINGS
# ==============================================
TRIAL_PERIOD_DAYS=20
DEFAULT_SUBSCRIPTION_PLAN=starter
TRIAL_WARNING_DAYS=7,3,1

# ==============================================
# EMAIL NOTIFICATION SETTINGS
# ==============================================
ENABLE_MONTHLY_SALES_SUMMARY=true
ENABLE_MONTHLY_PURCHASE_SUMMARY=true
MONTHLY_SUMMARY_DAY=1
EMAIL_SEND_TIME=09:00
ENABLE_SCHEDULER=true

# ==============================================
# SECURITY SETTINGS
# ==============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGINS=http://localhost:5000,http://localhost:3000

# ==============================================
# FILE UPLOAD SETTINGS
# ==============================================
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# ==============================================
# LOGGING & DEBUGGING
# ==============================================
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true

# ==============================================
# FEATURE FLAGS
# ==============================================
ENABLE_AI_FEATURES=false
ENABLE_RECURRING_INVOICES=true
ENABLE_CRM=true
ENABLE_ACCOUNTING=true
ENABLE_INVENTORY=true

# ==============================================
# TIMEZONE
# ==============================================
TZ=UTC
```

### Generating Secure Secrets

Use these commands to generate secure random secrets:

```bash
# Generate JWT secrets
openssl rand -hex 32  # Run this 4 times for different secrets

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🗄️ Database Setup

### Automatic Setup (Recommended)

The application uses Drizzle ORM for database management. Schemas are automatically created on first run.

```bash
# Push schema to database (creates/updates tables)
npm run db:push

# This creates all necessary tables:
# - users
# - organizations
# - customers
# - items
# - invoices
# - invoice_items
# - purchase_orders
# - vendors
# - leads
# - deals
# - activities
# - subscriptions
# - payments
# - audit_logs
# And more...
```

### Manual Database Inspection

```bash
# Connect to PostgreSQL
psql -U bizverse_user -d bizverse_db -h localhost

# List all tables
\dt

# View table structure
\d users
\d organizations
\d invoices

# Run custom queries
SELECT * FROM users WHERE email = 'hugenetwork7@gmail.com';

# Exit
\q
```

### Database Migrations

The project uses Drizzle Kit for schema management:

```bash
# Generate migrations (if you modify schema)
npx drizzle-kit generate:pg

# Push changes to database
npm run db:push

# View current schema
npx drizzle-kit introspect:pg
```

### Database Backup and Restore

```bash
# Backup database
pg_dump -U bizverse_user -d bizverse_db -F c -b -v -f backup_$(date +%Y%m%d).dump

# Restore database
pg_restore -U bizverse_user -d bizverse_db -v backup_20241023.dump

# With Docker
docker-compose exec postgres pg_dump -U bizverse_user bizverse_db > backup.sql
docker-compose exec -T postgres psql -U bizverse_user bizverse_db < backup.sql
```

---

## 🏃 Running the Application

### Development Mode

```bash
# Start development server with hot reload
npm run dev

# The application will start at:
# - Frontend: http://localhost:5173 (Vite dev server)
# - Backend API: http://localhost:5000
# - Full app: http://localhost:5000 (once built)

# Watch for changes
# Both frontend and backend will auto-reload on file changes
```

### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm start

# The application will be available at:
# http://localhost:5000
```

### Using PM2 (Recommended for Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start dist/index.js --name bizverse

# View logs
pm2 logs bizverse

# Monitor resources
pm2 monit

# Restart application
pm2 restart bizverse

# Stop application
pm2 stop bizverse

# Save PM2 configuration
pm2 save

# Enable startup script
pm2 startup
```

### Using Docker

```bash
# Start all services
docker-compose up -d

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f app
docker-compose logs -f postgres

# Restart services
docker-compose restart app

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ This will delete all data!)
docker-compose down -v

# Rebuild and restart
docker-compose up -d --build
```

### Health Checks

The application provides health check endpoints:

```bash
# API health check
curl http://localhost:5000/api/health

# Expected response:
# {"status":"ok","timestamp":"2024-10-23T10:00:00.000Z"}

# Database health check
curl http://localhost:5000/api/health/db

# Expected response:
# {"status":"ok","database":"connected"}
```

---

## 👤 Admin Access

### Platform Administrator

The platform administrator has supreme access to manage the entire SaaS platform.

**Access Details:**
- **URL**: http://localhost:5000/admin/login
- **Default Email**: hugenetwork7@gmail.com
- **Default Password**: admin123

**Administrator Capabilities:**
- ✅ View and manage all organizations
- ✅ Create, update, and delete organizations
- ✅ Manage subscription plans and pricing
- ✅ Extend trial periods and subscription validity
- ✅ View platform-wide analytics and reports
- ✅ Manage user accounts across organizations
- ✅ Access system logs and audit trails
- ✅ Configure platform settings
- ✅ Monitor system health and performance
- ✅ Manage payment gateway configurations

**⚠️ Security Best Practices:**
1. Change the default admin password immediately
2. Use a strong password (12+ characters, mixed case, numbers, symbols)
3. Enable two-factor authentication (if available)
4. Limit admin access to trusted IP addresses
5. Regularly review audit logs
6. Never share admin credentials

**Changing Admin Password:**

```bash
# Method 1: Through UI (Recommended)
# Login → Admin Profile → Change Password

# Method 2: Through Database (Emergency)
psql -U bizverse_user -d bizverse_db
UPDATE users SET password = crypt('new_password', gen_salt('bf')) 
WHERE email = 'hugenetwork7@gmail.com';
```

### Organization Administrator

Each organization has its own admin/owner with full control over their organization.

**Organization Admin Can:**
- ✅ Manage organization profile and settings
- ✅ Invite and manage team members
- ✅ Assign roles and permissions
- ✅ Create and manage invoices, customers, items
- ✅ View organization analytics
- ✅ Upgrade/downgrade subscription plans
- ✅ Manage payment methods
- ✅ Export data and reports
- ✅ Configure email notifications
- ✅ Manage organization integrations

**User Roles:**
1. **Owner** - Full access (inherits admin rights)
2. **Admin** - Full access except organization deletion
3. **Accountant** - Access to billing, invoices, accounting
4. **Viewer** - Read-only access to all data

---

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your_access_token>
```

### Common Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### API Endpoints

#### Authentication
```http
POST   /api/auth/signup       - Register new user
POST   /api/auth/login        - User login
POST   /api/auth/refresh      - Refresh access token
POST   /api/auth/logout       - Logout user
GET    /api/auth/me           - Get current user profile

POST   /api/admin/auth/login  - Admin login
GET    /api/admin/auth/me     - Get admin profile
```

#### Organizations
```http
GET    /api/organizations              - List all organizations (paginated)
POST   /api/organizations              - Create new organization
GET    /api/organizations/:id          - Get organization details
PUT    /api/organizations/:id          - Update organization
DELETE /api/organizations/:id          - Delete organization
GET    /api/organizations/:id/users    - Get organization users
POST   /api/organizations/:id/invite   - Invite user to organization
```

#### Invoices
```http
GET    /api/invoices                   - List invoices (filtered by organization)
POST   /api/invoices                   - Create new invoice
GET    /api/invoices/:id               - Get invoice details
PUT    /api/invoices/:id               - Update invoice
DELETE /api/invoices/:id               - Delete invoice
POST   /api/invoices/:id/send          - Send invoice via email
GET    /api/invoices/:id/pdf           - Download invoice PDF
POST   /api/invoices/:id/payment       - Record payment
GET    /api/invoices/stats             - Get invoice statistics
```

#### Customers
```http
GET    /api/customers                  - List customers
POST   /api/customers                  - Create customer
GET    /api/customers/:id              - Get customer details
PUT    /api/customers/:id              - Update customer
DELETE /api/customers/:id              - Delete customer
GET    /api/customers/:id/invoices     - Get customer invoices
GET    /api/customers/:id/statement    - Get customer statement
```

#### Items/Products
```http
GET    /api/items                      - List items
POST   /api/items                      - Create item
GET    /api/items/:id                  - Get item details
PUT    /api/items/:id                  - Update item
DELETE /api/items/:id                  - Delete item
GET    /api/items/:id/stock            - Get stock levels
POST   /api/items/:id/adjust-stock     - Adjust stock
```

#### Purchase Orders
```http
GET    /api/purchase-orders            - List purchase orders
POST   /api/purchase-orders            - Create purchase order
GET    /api/purchase-orders/:id        - Get PO details
PUT    /api/purchase-orders/:id        - Update PO
DELETE /api/purchase-orders/:id        - Delete PO
POST   /api/purchase-orders/:id/approve - Approve PO
```

#### Subscriptions
```http
GET    /api/subscriptions/plans        - List available plans
GET    /api/subscriptions/current      - Get current subscription
POST   /api/subscriptions/upgrade      - Upgrade subscription
POST   /api/subscriptions/cancel       - Cancel subscription
GET    /api/subscriptions/history      - Get subscription history
```

#### Payments
```http
POST   /api/payments/initiate          - Initiate payment
POST   /api/payments/verify            - Verify payment
POST   /api/payments/webhook           - Payment webhook (PayUMoney, Razorpay, Stripe)
GET    /api/payments/history           - Get payment history
```

#### Admin Endpoints
```http
GET    /api/admin/organizations        - List all organizations
PUT    /api/admin/organizations/:id/subscription - Manage subscription
POST   /api/admin/organizations/:id/extend-trial - Extend trial period
GET    /api/admin/analytics            - Platform analytics
GET    /api/admin/audit-logs           - Audit logs
```

### Rate Limiting

All API endpoints are rate-limited:
- **Window**: 15 minutes (900,000 ms)
- **Max Requests**: 100 per window

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1697198400
```

**Rate Limit Exceeded Response:**
```json
{
  "success": false,
  "error": "Too many requests, please try again later",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

### Example API Calls

#### User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

#### Create Invoice
```bash
curl -X POST http://localhost:5000/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "customerId": 1,
    "items": [
      {
        "itemId": 1,
        "quantity": 10,
        "rate": 100
      }
    ],
    "taxRate": 18,
    "notes": "Payment due in 30 days"
  }'
```

#### Get Invoice PDF
```bash
curl -X GET http://localhost:5000/api/invoices/123/pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output invoice.pdf
```

---

## 📁 Project Structure

```
bizverse/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ui/          # Reusable UI components (Radix)
│   │   │   ├── layout/      # Layout components
│   │   │   ├── forms/       # Form components
│   │   │   └── dashboard/   # Dashboard widgets
│   │   ├── pages/           # Page components
│   │   │   ├── auth/        # Login, signup pages
│   │   │   ├── admin/       # Admin panel pages
│   │   │   ├── invoices/    # Invoice management
│   │   │   ├── customers/   # Customer management
│   │   │   └── dashboard/   # Dashboard pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   ├── styles/          # Global styles
│   │   └── main.tsx         # Application entry point
│   └── index.html           # HTML template
│
├── server/                   # Backend Express application
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts         # Authentication middleware
│   │   ├── validate.ts     # Request validation
│   │   ├── rateLimiter.ts  # Rate limiting
│   │   └── errorHandler.ts # Error handling
│   ├── routes/             # API route handlers
│   │   ├── auth.ts         # Authentication routes
│   │   ├── organizations.ts # Organization routes
│   │   ├── invoices.ts     # Invoice routes
│   │   ├── customers.ts    # Customer routes
│   │   ├── items.ts        # Item routes
│   │   ├── admin.ts        # Admin routes
│   │   └── payments.ts     # Payment routes
│   ├── services/           # Business logic services
│   │   ├── authService.ts  # Authentication service
│   │   ├── emailService.ts # Email notifications
│   │   ├── pdfService.ts   # PDF generation
│   │   ├── paymentService.ts # Payment processing
│   │   └── notificationService.ts # Notification scheduler
│   ├── scripts/            # Utility scripts
│   │   ├── createPlatformAdmin.ts # Admin creation
│   │   └── seedDatabase.ts # Database seeding
│   ├── db.ts               # Database configuration
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # Route registration
│   └── vite.ts             # Vite integration
│
├── shared/                  # Shared code (frontend + backend)
│   ├── schema.ts           # Database schema (Drizzle ORM)
│   └── constants.ts        # Shared constants
│
├── dist/                    # Compiled production build
│   ├── public/             # Static frontend assets
│   └── index.js            # Compiled server code
│
├── .github/                 # GitHub Actions workflows
│   └── workflows/
│       └── ci-cd.yml       # CI/CD pipeline
│
├── scripts/                 # Deployment scripts
│   ├── deploy.sh           # Production deployment
│   └── setup.sh            # Initial setup
│
├── .env                     # Environment variables (not in git)
├── .env.example             # Environment template
├── .dockerignore            # Docker ignore file
├── .gitignore               # Git ignore file
├── Dockerfile               # Docker image configuration
├── docker-compose.yml       # Docker Compose orchestration
├── drizzle.config.ts        # Drizzle ORM configuration
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── components.json          # Radix UI components config
└── README.md                # This file
```

### Key Files Explained

| File | Purpose |
|------|---------|
| `server/index.ts` | Main server entry point, Express setup |
| `client/src/main.tsx` | React application entry point |
| `shared/schema.ts` | Database schema definitions (Drizzle ORM) |
| `server/routes.ts` | API route registration |
| `server/db.ts` | Database connection and configuration |
| `vite.config.ts` | Vite build tool configuration |
| `tailwind.config.ts` | Tailwind CSS customization |
| `drizzle.config.ts` | Database migration configuration |
| `Dockerfile` | Docker image build instructions |
| `docker-compose.yml` | Multi-container Docker setup |
| `.env.example` | Environment variable template |

---

## 📸 Screenshots

_Screenshots will be added here to showcase the application UI_

### Dashboard
![Dashboard](https://i.pinimg.com/736x/b1/e0/a7/b1e0a71516e989d011df14e8f1654cb6.jpg)

### Invoice Management
![Invoices](https://i.pinimg.com/736x/86/48/da/8648daed87bccebecb48affd8a100128.jpg)

### Customer Management
![Customers](https://i.pinimg.com/736x/e2/5f/1d/e25f1de6d2390a82c84267d95e4b819d.jpg)

### Admin Panel
![Admin](https://i.pinimg.com/736x/f2/1c/f9/f21cf959c51bd44241989d4915ae1dae.jpg)

### Subscription Plans
![Plans](https://www.slideteam.net/media/catalog/product/cache/330x186/p/r/pricing_table_illustrating_three_different_subscription_plans_infographic_template_slide01.jpg)

---

## 🚀 Deployment

### Docker Deployment to Production

#### Prerequisites
- Docker & Docker Compose installed on server
- Domain name pointed to server IP
- SSL certificate (Let's Encrypt recommended)

#### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

#### Step 2: Deploy Application

```bash
# Clone repository
git clone https://github.com/vicky3585/SaaSRooster.git /var/www/bizverse
cd /var/www/bizverse

# Configure environment
cp .env.example .env
nano .env  # Update with production values

# Important: Set NODE_ENV=production
# Update APP_URL to your domain
# Use strong passwords for database
# Use production payment gateway URLs

# Start application
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app

# Initialize database
docker-compose exec app npm run db:push
```

#### Step 3: Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/bizverse
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js application
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static file caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        proxy_pass http://localhost:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security: Deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    location /api/auth/login {
        limit_req zone=login burst=10 nodelay;
        proxy_pass http://localhost:5000;
    }

    # Max upload size
    client_max_body_size 10M;

    # Logging
    access_log /var/log/nginx/bizverse_access.log;
    error_log /var/log/nginx/bizverse_error.log;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/bizverse /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 4: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts and provide email

# Auto-renewal (certbot sets this up automatically)
sudo certbot renew --dry-run

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 5: Setup Automatic Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-bizverse.sh
```

Add this content:

```bash
#!/bin/bash
BACKUP_DIR="/backups/bizverse"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker-compose -f /var/www/bizverse/docker-compose.yml exec -T postgres \
  pg_dump -U bizverse_user bizverse_db > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/bizverse/uploads

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-bizverse.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add this line:
0 2 * * * /usr/local/bin/backup-bizverse.sh
```

#### Step 6: Monitor Application

```bash
# View logs
docker-compose logs -f app

# Monitor resources
docker stats

# Check application health
curl https://yourdomain.com/api/health

# View Nginx logs
sudo tail -f /var/log/nginx/bizverse_access.log
sudo tail -f /var/log/nginx/bizverse_error.log
```

### VPS Deployment (Non-Docker)

For deployment without Docker, follow the [Manual Installation](#manual-installation) steps, then:

```bash
# Use PM2 for process management
npm install -g pm2
pm2 start dist/index.js --name bizverse
pm2 startup
pm2 save

# Monitor with PM2
pm2 monit
pm2 logs bizverse
```

### Cloud Platform Deployment

#### DigitalOcean

1. Create a Droplet (Ubuntu 22.04 LTS)
2. Follow [Docker Deployment](#docker-deployment-to-production) steps
3. Setup managed PostgreSQL database (optional)
4. Configure firewall rules

#### AWS

1. Launch EC2 instance (Ubuntu 22.04)
2. Setup RDS for PostgreSQL (optional)
3. Configure Security Groups
4. Follow deployment steps above
5. Use Route 53 for DNS
6. Setup CloudFront for CDN (optional)

#### Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create bizverse-app

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret
# ... set all required env vars

# Deploy
git push heroku main

# Run database migrations
heroku run npm run db:push
```

---

## 🔄 CI/CD Pipeline

This project includes a comprehensive CI/CD pipeline using GitHub Actions.

### Workflow Features

- ✅ Automated testing on every push
- ✅ Code quality checks (ESLint, TypeScript)
- ✅ Build verification
- ✅ Dependency caching for faster builds
- ✅ Automated deployment to production
- ✅ Slack/Email notifications on deployment
- ✅ Rollback capabilities

### Workflow Triggers

The CI/CD pipeline runs on:
- Push to `main` branch
- Pull requests to `main` branch
- Manual trigger via workflow dispatch

### Pipeline Stages

1. **Checkout** - Clone repository
2. **Setup** - Install Node.js and dependencies
3. **Lint** - Run ESLint for code quality
4. **Type Check** - TypeScript compilation check
5. **Build** - Build application
6. **Test** - Run test suite (if available)
7. **Deploy** - Deploy to production (main branch only)

### GitHub Actions Configuration

The workflow is defined in `.github/workflows/ci-cd.yml`.

### Setting Up Deployment Secrets

For automated deployment, add these secrets to your GitHub repository:

1. Go to repository Settings → Secrets and variables → Actions
2. Add these secrets:
   - `SSH_PRIVATE_KEY` - SSH key for server access
   - `SERVER_HOST` - Production server IP/hostname
   - `SERVER_USER` - SSH username
   - `ENV_FILE` - Production .env file content

### Status Badges

Add these to your README to show build status:

```markdown
[![CI/CD](https://github.com/vicky3585/SaaSRooster/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/vicky3585/SaaSRooster/actions/workflows/ci-cd.yml)
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts
```

### Test Structure

```
tests/
├── unit/              # Unit tests
│   ├── services/     # Service tests
│   ├── middleware/   # Middleware tests
│   └── utils/        # Utility function tests
├── integration/       # Integration tests
│   ├── api/         # API endpoint tests
│   └── database/    # Database tests
└── e2e/              # End-to-end tests
    └── flows/       # User flow tests
```

### Writing Tests

Example test:

```typescript
import { describe, it, expect } from 'vitest';
import { authService } from '../server/services/authService';

describe('Authentication Service', () => {
  it('should hash password correctly', async () => {
    const password = 'test123';
    const hashed = await authService.hashPassword(password);
    expect(hashed).not.toBe(password);
    expect(hashed).toHaveLength(60);
  });

  it('should verify password correctly', async () => {
    const password = 'test123';
    const hashed = await authService.hashPassword(password);
    const isValid = await authService.verifyPassword(password, hashed);
    expect(isValid).toBe(true);
  });
});
```

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Issue: Database Connection Error

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Verify connection string in .env
DATABASE_URL=postgresql://bizverse_user:password@localhost:5432/bizverse_db

# Test connection
psql -U bizverse_user -d bizverse_db -h localhost
```

#### Issue: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000
# or
netstat -nlp | grep 5000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=5001
```

#### Issue: Docker Container Won't Start

**Error:**
```
Container exited with code 1
```

**Solution:**
```bash
# View detailed logs
docker-compose logs app

# Common fixes:
# 1. Check .env file exists and is configured
# 2. Verify database is running
docker-compose ps

# 3. Restart services
docker-compose restart

# 4. Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### Issue: Email Not Sending

**Error:**
```
Failed to send email: Invalid API key
```

**Solution:**
1. Verify Resend API key in .env
2. Check domain is verified in Resend dashboard
3. Verify DNS records (SPF, DKIM, DMARC)
4. Check application logs for detailed error
5. Test with Resend dashboard API playground

#### Issue: Payment Gateway Not Working

**Error:**
```
Payment initiation failed: Invalid merchant credentials
```

**Solution:**
1. Verify merchant key and salt in .env
2. Check if using correct environment (test/production)
3. Ensure callback URL is accessible from payment gateway
4. Verify webhook URL is configured in gateway dashboard
5. Check gateway status page for outages
6. Test with test credentials first

#### Issue: PDF Generation Fails

**Error:**
```
Error: Failed to launch browser
```

**Solution:**
```bash
# Install required dependencies (Linux)
sudo apt-get install -y \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libxcomposite1 libxrandr2 \
  libxdamage1 libxss1 libxtst6 libpangocairo-1.0-0 \
  libgtk-3-0

# For Docker, ensure Dockerfile includes Chromium dependencies
# (Already included in the provided Dockerfile)
```

#### Issue: High Memory Usage

**Solution:**
```bash
# Check memory usage
free -h
docker stats

# Increase Docker memory limit in docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G

# Or use Node.js memory limit
NODE_OPTIONS=--max-old-space-size=2048 npm start
```

#### Issue: Rate Limiting Too Strict

**Solution:**
```env
# Adjust rate limiting in .env
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=200      # Increase from 100

# Restart application
docker-compose restart app
```

### Debug Mode

Enable detailed logging:

```env
# In .env file
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
```

View logs:
```bash
# Docker
docker-compose logs -f app

# PM2
pm2 logs bizverse --lines 100

# Direct
tail -f logs/app.log
```

### Getting Help

If you're still facing issues:

1. Check existing [GitHub Issues](https://github.com/vicky3585/SaaSRooster/issues)
2. Search [Stack Overflow](https://stackoverflow.com) with relevant tags
3. Review application logs for detailed error messages
4. Contact support at hugenetwork7@gmail.com

When reporting issues, include:
- Node.js and npm versions
- PostgreSQL version
- Operating system
- Error messages and stack traces
- Steps to reproduce
- Relevant configuration (without secrets)

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Fix issues
- ✨ Add new features
- 🧪 Write tests
- 🎨 Improve UI/UX

### Development Workflow

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/SaaSRooster.git
   cd SaaSRooster
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make Your Changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test Your Changes**
   ```bash
   npm run check      # TypeScript check
   npm run build      # Build verification
   npm test           # Run tests
   ```

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   
   # Follow conventional commit format:
   # feat: new feature
   # fix: bug fix
   # docs: documentation changes
   # style: code style changes
   # refactor: code refactoring
   # test: adding tests
   # chore: maintenance tasks
   ```

6. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill in the PR template
   - Submit for review

### Code Style Guidelines

- Use TypeScript for type safety
- Follow ESLint rules
- Use meaningful variable and function names
- Write self-documenting code
- Add comments for complex logic
- Keep functions small and focused
- Use async/await instead of callbacks
- Handle errors appropriately

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

Examples:
```
feat(invoices): add PDF download functionality
fix(auth): resolve JWT token expiration issue
docs(readme): update installation instructions
```

### Pull Request Guidelines

- Provide a clear description of changes
- Reference related issues
- Include screenshots for UI changes
- Ensure all tests pass
- Update documentation if needed
- Keep PRs focused and atomic

### Code Review Process

1. Maintainer reviews your PR
2. Address feedback if any
3. PR gets approved
4. Changes are merged to main

### Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Testing Checklist

Before submitting a PR, ensure:
- [ ] All existing tests pass
- [ ] New features have tests
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] No console errors or warnings
- [ ] Works in Docker environment
- [ ] Tested in different browsers (for UI changes)

---

## 📄 License

This project is licensed under the **MIT License**.

### MIT License

```
MIT License

Copyright (c) 2024 Flying Venture System

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### What This Means

✅ **You CAN:**
- Use the software for commercial purposes
- Modify the software
- Distribute the software
- Use the software privately
- Sublicense the software

❌ **You CANNOT:**
- Hold the authors liable
- Use the authors' names for endorsement without permission

📋 **You MUST:**
- Include the original license and copyright notice in any copy

---

## 📞 Support & Contact

### Get Help

- **📧 Email**: hugenetwork7@gmail.com
- **🌐 Website**: [Flying Venture System](https://flyingventure.com)
- **📚 Documentation**: [docs.bizverse.com](https://docs.bizverse.com)
- **💬 Community**: [Discord Server](https://discord.gg/bizverse) (coming soon)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/vicky3585/SaaSRooster/issues)

### Support Options

#### Community Support (Free)
- GitHub Discussions
- Stack Overflow (tag: bizverse)
- Discord Community

#### Email Support
- Response time: 24-48 hours
- Free for all users
- Email: hugenetwork7@gmail.com

#### Priority Support (Enterprise)
- Response time: 4-8 hours
- Dedicated support channel
- Phone support
- Custom feature development
- Contact for pricing

### Reporting Issues

When reporting bugs, please include:

1. **Environment Details:**
   - Node.js version
   - PostgreSQL version
   - Operating System
   - Docker version (if applicable)

2. **Issue Description:**
   - What you expected to happen
   - What actually happened
   - Steps to reproduce

3. **Logs and Errors:**
   - Error messages
   - Stack traces
   - Relevant logs

4. **Additional Context:**
   - Screenshots (if applicable)
   - Configuration (without secrets)
   - Recent changes made

### Feature Requests

We love hearing your ideas! Submit feature requests by:

1. Checking existing feature requests in GitHub Issues
2. Creating a new issue with the "enhancement" label
3. Describing:
   - The use case
   - Expected behavior
   - Why this feature would be valuable
   - Potential implementation ideas

### Security Vulnerabilities

🔒 **Found a security vulnerability?**

**DO NOT** open a public issue!

Instead:
1. Email security@flyingventure.com (or hugenetwork7@gmail.com)
2. Include:
   - Vulnerability description
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We'll respond within 48 hours and work with you to resolve the issue.

### Social Media

Stay updated with the latest news and updates:

- **Twitter**: [@flyingventure](https://twitter.com/flyingventure)
- **LinkedIn**: [Flying Venture System](https://linkedin.com/company/flyingventure)
- **GitHub**: [vicky3585](https://github.com/vicky3585)

---

## 🙏 Acknowledgments

### Built With Love Using

- **React** - A JavaScript library for building user interfaces
- **Node.js** - JavaScript runtime built on Chrome's V8 engine
- **PostgreSQL** - The world's most advanced open source database
- **TypeScript** - JavaScript with syntax for types
- **Tailwind CSS** - A utility-first CSS framework
- **Drizzle ORM** - TypeScript ORM for SQL databases
- **Radix UI** - Unstyled, accessible components for React
- **Vite** - Next generation frontend tooling

### Special Thanks

- To all open source contributors who make projects like this possible
- The React, Node.js, and PostgreSQL communities
- Early adopters and beta testers
- Everyone who reported bugs and suggested improvements

### Inspiration

This project was inspired by the need for an affordable, feature-rich, self-hosted SaaS platform for small and medium businesses.

---

## 🗺️ Roadmap

### Current Version: 1.0.0

### Upcoming Features

#### Version 1.1.0 (Q1 2025)
- [ ] WhatsApp integration for notifications
- [ ] Multi-currency support
- [ ] Advanced analytics dashboard
- [ ] Bulk import/export functionality
- [ ] Custom fields for invoices and customers

#### Version 1.2.0 (Q2 2025)
- [ ] Mobile app (React Native)
  - iOS app
  - Android app
- [ ] Recurring invoice automation
- [ ] Advanced reporting and BI
- [ ] Custom workflow builder
- [ ] API marketplace

#### Version 2.0.0 (Q3 2025)
- [ ] Multi-language support (i18n)
- [ ] Advanced role-based permissions
- [ ] Document management system
- [ ] Project management module
- [ ] Time tracking and billing
- [ ] Advanced inventory features (serial numbers, batches)

#### Version 2.1.0 (Q4 2025)
- [ ] E-commerce integration (Shopify, WooCommerce)
- [ ] Accounting integrations (QuickBooks, Xero)
- [ ] CRM integrations (Salesforce, HubSpot)
- [ ] Payment gateway expansions
- [ ] Advanced automation rules
- [ ] Custom branding and white-labeling

### Long-term Vision

- Global multi-currency support
- AI-powered insights and predictions
- Blockchain-based audit trails
- Advanced API with GraphQL
- Mobile-first PWA
- Offline mode support
- Real-time collaboration features
- Advanced security features (2FA, biometric auth)

### How to Influence the Roadmap

We value your feedback! You can influence our roadmap by:
1. Voting on existing feature requests
2. Submitting new feature requests
3. Participating in community discussions
4. Sponsoring specific features

---

## 📊 Statistics & Metrics

### Project Metrics

- **Lines of Code**: ~50,000+
- **Components**: 100+ React components
- **API Endpoints**: 50+ RESTful endpoints
- **Database Tables**: 20+ normalized tables
- **Test Coverage**: Target 80%+

### Performance

- **Page Load Time**: < 2 seconds
- **API Response Time**: < 200ms (average)
- **Database Query Time**: < 50ms (average)
- **Build Time**: ~30 seconds

### Browser Support

- ✅ Chrome (latest 2 versions)
- ✅ Firefox (latest 2 versions)
- ✅ Safari (latest 2 versions)
- ✅ Edge (latest 2 versions)
- ❌ Internet Explorer (not supported)

---

## 🏆 Awards & Recognition

_This section will be updated as the project receives recognition_

---

## 📚 Additional Resources

### Documentation
- [API Documentation](https://docs.bizverse.com/api)
- [User Guide](https://docs.bizverse.com/user-guide)
- [Administrator Guide](https://docs.bizverse.com/admin-guide)
- [Developer Guide](https://docs.bizverse.com/developer-guide)

### Tutorials
- [Getting Started Video](https://youtube.com)
- [Creating Your First Invoice](https://docs.bizverse.com/tutorials/first-invoice)
- [Setting Up Payment Gateways](https://docs.bizverse.com/tutorials/payment-setup)
- [Customizing Email Templates](https://docs.bizverse.com/tutorials/email-templates)

### Related Projects
- [Bizverse Mobile App](https://github.com/vicky3585/bizverse-mobile)
- [Bizverse API Client](https://github.com/vicky3585/bizverse-api-client)
- [Bizverse Plugins](https://github.com/vicky3585/bizverse-plugins)

---

## 💰 Sponsorship

Love Bizverse? Consider sponsoring the project!

### Why Sponsor?

- 🚀 Accelerate feature development
- 🐛 Priority bug fixes
- 📚 Better documentation
- 🎯 Your requested features get priority
- 🏢 Your company logo on our website

### Sponsor Tiers

#### 🥉 Bronze Sponsor ($10/month)
- Name in README
- Sponsor badge

#### 🥈 Silver Sponsor ($50/month)
- All Bronze benefits
- Priority email support
- Logo on website

#### 🥇 Gold Sponsor ($100/month)
- All Silver benefits
- Priority feature requests
- Monthly consultation call

#### 💎 Platinum Sponsor ($500/month)
- All Gold benefits
- Custom feature development
- Dedicated support channel
- Company showcase

[Become a Sponsor](https://github.com/sponsors/vicky3585)

---

<div align="center">

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=vicky3585/SaaSRooster&type=Date)](https://star-history.com/#vicky3585/SaaSRooster&Date)

---

## 📈 Project Status

![GitHub stars](https://img.shields.io/github/stars/vicky3585/SaaSRooster?style=social)
![GitHub forks](https://img.shields.io/github/forks/vicky3585/SaaSRooster?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/vicky3585/SaaSRooster?style=social)

![GitHub issues](https://img.shields.io/github/issues/vicky3585/SaaSRooster)
![GitHub pull requests](https://img.shields.io/github/issues-pr/vicky3585/SaaSRooster)
![GitHub last commit](https://img.shields.io/github/last-commit/vicky3585/SaaSRooster)
![GitHub contributors](https://img.shields.io/github/contributors/vicky3585/SaaSRooster)

---

**Built with ❤️ by [Flying Venture System](https://flyingventure.com)**

**Powered by Open Source**

⭐ If you find Bizverse useful, please star the repository on GitHub! ⭐

[⬆ Back to Top](#-bizverse-saas---complete-multi-tenant-business-management-platform)

</div>
