# Bizverse SaaS - Flying Venture System

<div align="center">

![Bizverse Logo](https://i.pinimg.com/600x315/e9/20/3a/e9203a65f5926baf9309c6f2567321d2.jpg)

**A Complete Multi-Tenant SaaS Platform for Business Management**

[![License](https://i.ytimg.com/vi/4cgpu9L2AE8/maxresdefault.jpg)
[![Node.js](https://i.ytimg.com/vi/uUalQbg-TGA/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDCyUJjd8iTH-USqdXz5eOCIY3KfA)
[![PostgreSQL](https://miro.medium.com/1*uw2XzJO65Li-qGEqoYzdmw.png)
[![Docker](https://pbs.twimg.com/media/EIc4Y5LWkAI1Pnd?format=jpg&name=medium)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Docker Installation](#docker-installation-recommended)
  - [Manual Installation](#manual-installation)
- [Configuration](#configuration)
- [Admin Access](#admin-access)
- [Subscription & Trial System](#subscription--trial-system)
- [Payment Gateway Integration](#payment-gateway-integration)
- [Email Notifications](#email-notifications)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

---

## 🌟 Overview

**Bizverse SaaS** by **Flying Venture System** is a comprehensive, production-ready multi-tenant SaaS platform designed for modern businesses. It combines powerful billing, accounting, inventory management, and CRM capabilities in one unified platform.

### Key Highlights

- **20-Day Free Trial** for new organizations
- **Multi-Organization Support** with role-based access control
- **Integrated Payment Gateway** (PayUMoney, Razorpay, Stripe)
- **Automated Email Notifications** for sales and purchase summaries
- **Professional UI** with mobile-responsive design
- **Docker-Ready** for easy deployment
- **Production-Grade Security** with JWT authentication, rate limiting, and CORS

---

## ✨ Features

### 🎯 Core Features

#### Billing & Invoicing
- Create and manage sales invoices
- GST-compliant invoicing (CGST, SGST, IGST)
- Multiple invoice templates
- PDF generation and email delivery
- Payment tracking and reconciliation
- Credit/Debit notes
- Recurring invoices

#### Inventory Management
- Product/Item master with SKU and barcode
- Multi-warehouse support
- Stock tracking and adjustments
- Batch and serial number tracking
- Low stock alerts
- Purchase orders and GRN

#### Accounting
- Chart of accounts
- Journal entries with auto-posting
- Financial reports (P&L, Balance Sheet)
- GST reports (GSTR-1, GSTR-3B ready)
- Expense tracking
- Bank reconciliation

#### CRM
- Lead management with pipeline stages
- Deal/Opportunity tracking
- Contact and account management
- Activity tracking (calls, emails, meetings)
- Task management with priorities
- Sales forecasting

#### Purchase Management
- Vendor master
- Purchase orders
- Purchase invoices
- Vendor payments and TDS tracking
- Vendor statements

### 🔐 Security Features

- **JWT Authentication** with refresh tokens
- **Organization-Scoped Access Control**
- **Role-Based Permissions** (Owner, Admin, Accountant, Viewer)
- **Rate Limiting** on API endpoints
- **CORS Protection**
- **Password Hashing** with bcrypt
- **SQL Injection Protection**
- **XSS Prevention**
- **Audit Logging** for all critical actions

### 📧 Email Notifications

- **Monthly Sales Summary** - Automated reports on 1st of each month
- **Monthly Purchase Summary** - Comprehensive purchase analytics
- **Trial Expiration Warnings** - Reminders at 7, 3, and 1 day before expiry
- **Subscription Renewal Reminders**
- **Invoice Delivery** via email with PDF attachment
- Professional email templates with branding

### 💳 Payment Gateway Integration

#### Supported Gateways
1. **PayUMoney** - Primary integration
2. **Razorpay** - Alternative option
3. **Stripe** - International payments
4. **Paytm** - UPI and wallets
5. **CCAvenue** - Multiple payment modes

All gateways support:
- Test and production modes
- Webhook callbacks for payment verification
- Refund processing
- Transaction reconciliation

### 📊 Subscription Management

- **20-Day Free Trial** for all new organizations
- **Trial to Paid Conversion** flow
- **Multiple Subscription Plans** (Starter, Professional, Enterprise)
- **Automated Trial Expiration** handling
- **Grace Period** management
- **Usage Tracking** and limits enforcement

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js 22.x
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 15
- **ORM:** Drizzle ORM
- **Authentication:** JWT (jsonwebtoken)
- **Email:** Resend API
- **PDF Generation:** Puppeteer

### Frontend
- **Framework:** React 18.x
- **Routing:** Wouter
- **State Management:** TanStack Query
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Build Tool:** Vite
- **Charts:** Recharts

### DevOps
- **Containerization:** Docker & Docker Compose
- **Database:** PostgreSQL with connection pooling
- **Process Manager:** PM2 (optional)
- **Monitoring:** Health check endpoints

---

## 📦 Prerequisites

### For Docker Installation (Recommended)
- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 10GB disk space

### For Manual Installation
- Node.js 22.x or later
- npm 10.x or later
- PostgreSQL 15 or later
- Git

---

## 🚀 Installation

### Docker Installation (Recommended)

#### 1. Clone or Extract the Repository

```bash
cd /path/to/bizverse
```

#### 2. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` and configure required variables:

```env
# Essential Configuration
DATABASE_URL=postgresql://bizverse_user:your_secure_password@postgres:5432/bizverse_db

# JWT Secrets (Generate using: openssl rand -hex 32)
JWT_SECRET=your_jwt_secret_here
REFRESH_SECRET=your_refresh_secret_here
ADMIN_JWT_SECRET=your_admin_secret_here
SESSION_SECRET=your_session_secret_here

# Email Service
RESEND_API_KEY=re_your_resend_api_key

# Payment Gateway (PayUMoney)
PAYUMONEY_MERCHANT_KEY=your_merchant_key
PAYUMONEY_MERCHANT_SALT=your_merchant_salt

# Optional: Change admin credentials
ADMIN_EMAIL=hugenetwork7@gmail.com
ADMIN_PASSWORD=admin123
```

#### 3. Start the Application

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Check status
docker-compose ps
```

#### 4. Initialize the Database

```bash
# Push database schema
docker-compose exec app npm run db:push

# Create admin user (if not auto-created)
docker-compose exec app npx tsx server/scripts/createPlatformAdmin.ts
```

#### 5. Access the Application

- **Application:** http://localhost:5000
- **Admin Panel:** http://localhost:5000/admin/login
- **Database Admin** (dev): http://localhost:8080 (if using `--profile dev`)

**Admin Credentials:**
- Email: `hugenetwork7@gmail.com`
- Password: `admin123`

⚠️ **Change the admin password immediately after first login!**

---

### Manual Installation

#### 1. Install Dependencies

```bash
# Install Node.js 22.x (if not installed)
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v22.x.x
npm --version   # Should show 10.x.x
```

#### 2. Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 3. Create Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In psql prompt
CREATE USER bizverse_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE bizverse_db WITH OWNER bizverse_user ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE bizverse_db TO bizverse_user;
\q
```

#### 4. Configure Application

```bash
# Create environment file
cp .env.example .env

# Edit .env with your database credentials and API keys
nano .env
```

#### 5. Install Dependencies and Build

```bash
# Install npm packages
npm install

# Push database schema
npm run db:push

# Create admin user
npm run create-admin

# Build for production
npm run build
```

#### 6. Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm start

# With PM2 (recommended for production)
npm install -g pm2
pm2 start dist/index.js --name bizverse
pm2 save
pm2 startup
```

---

## ⚙️ Configuration

### Environment Variables

All configuration is done through environment variables. See `.env.example` for complete list.

#### Essential Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret for access tokens | Required |
| `REFRESH_SECRET` | Secret for refresh tokens | Required |
| `ADMIN_JWT_SECRET` | Secret for admin tokens | Required |
| `RESEND_API_KEY` | Resend API key for emails | Required |
| `PAYUMONEY_MERCHANT_KEY` | PayUMoney merchant key | Required |
| `PAYUMONEY_MERCHANT_SALT` | PayUMoney merchant salt | Required |

#### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Application port | 5000 |
| `NODE_ENV` | Environment (development/production) | development |
| `TRIAL_PERIOD_DAYS` | Trial period in days | 20 |
| `TRIAL_WARNING_DAYS` | Days for trial warnings | 7,3,1 |
| `ENABLE_SCHEDULER` | Enable automated jobs | true (production) |
| `MONTHLY_SUMMARY_DAY` | Day of month for summaries | 1 |
| `EMAIL_SEND_TIME` | Time to send emails (HH:MM) | 09:00 |

---

## 👤 Admin Access

### Platform Admin

The platform admin has full access to:
- Organization management
- User management across all organizations
- Subscription plan management
- Platform settings and configuration
- System monitoring and logs

**Default Admin Login:**
- URL: `http://localhost:5000/admin/login`
- Email: `hugenetwork7@gmail.com`
- Password: `admin123`

⚠️ **Security:** Change the admin password immediately after installation!

### Organization Admin

Each organization has its own admin/owner who can:
- Manage organization settings
- Invite and manage team members
- Assign roles and permissions
- Upgrade subscription plans
- View organization analytics

---

## 💎 Subscription & Trial System

### Free Trial

- **Duration:** 20 days (configurable)
- **Features:** Full access to all features
- **Limitations:** None during trial
- **Notifications:** 
  - 7 days before expiry
  - 3 days before expiry
  - 1 day before expiry
  - On expiry

### Trial Expiration

When trial expires:
1. Organization status changes to "expired"
2. Users cannot access the application
3. Data is preserved for 30 days
4. Admin receives expiration notification
5. Upgrade prompt is shown

### Upgrading from Trial

1. Navigate to Subscription Settings
2. Choose a plan (Starter/Professional/Enterprise)
3. Complete payment via PayUMoney
4. Instant activation upon successful payment
5. Access restored immediately

### Subscription Plans

#### Starter Plan
- ₹999/month or ₹9,999/year
- Up to 5 users
- 1000 invoices/month
- Basic features

#### Professional Plan
- ₹2,999/month or ₹29,999/year
- Up to 25 users
- Unlimited invoices
- Advanced features
- Priority support

#### Enterprise Plan
- Custom pricing
- Unlimited users
- Unlimited invoices
- All features
- Dedicated support
- Custom integrations

---

## 💳 Payment Gateway Integration

### PayUMoney Setup

1. **Get Credentials:**
   - Sign up at [PayUMoney](https://www.payumoney.com/)
   - Complete KYC verification
   - Get Merchant Key and Salt from dashboard

2. **Configure in .env:**
   ```env
   PAYUMONEY_MERCHANT_KEY=your_merchant_key
   PAYUMONEY_MERCHANT_SALT=your_merchant_salt
   PAYUMONEY_BASE_URL=https://sandboxsecure.payu.in/_payment  # Test
   # PAYUMONEY_BASE_URL=https://secure.payu.in/_payment  # Production
   ```

3. **Test Mode:**
   - Use test cards provided by PayUMoney
   - Verify webhook callbacks
   - Check transaction logs

4. **Go Live:**
   - Switch to production URL
   - Update environment variables
   - Test with real transactions
   - Monitor payment success rate

### Razorpay Setup (Optional)

```env
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

### Stripe Setup (Optional)

```env
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

---

## 📧 Email Notifications

### Resend Setup

1. **Get API Key:**
   - Sign up at [Resend](https://resend.com/)
   - Verify your sending domain
   - Generate API key

2. **Configure Domain:**
   - Add DNS records (SPF, DKIM, DMARC)
   - Verify domain ownership
   - Wait for DNS propagation

3. **Update .env:**
   ```env
   RESEND_API_KEY=re_your_api_key
   FROM_EMAIL=invoices@yourdomain.com
   FROM_NAME=Flying Venture System
   ```

### Automated Notifications

The system sends:

1. **Monthly Sales Summary** (1st of each month at 9 AM)
   - Total sales amount
   - Number of invoices
   - Paid vs pending amounts
   - Top customers

2. **Monthly Purchase Summary** (1st of each month at 9 AM)
   - Total purchase amount
   - Number of purchase invoices
   - Payment status
   - Top vendors

3. **Trial Expiration Warnings**
   - At 7, 3, and 1 day before expiry
   - Includes upgrade call-to-action

4. **Subscription Renewal Reminders**
   - Before subscription ends
   - Payment failure notifications

### Customizing Notifications

Edit `server/services/notificationService.ts` to:
- Change email templates
- Modify sending schedules
- Add new notification types
- Customize content and branding

---

## 📚 API Documentation

### Authentication

All API endpoints (except login/signup) require JWT authentication.

#### Headers
```
Authorization: Bearer <access_token>
```

### Base URL

```
http://localhost:5000/api
```

### Key Endpoints

#### Authentication
```
POST /api/auth/login        - User login
POST /api/auth/signup       - User signup
POST /api/auth/refresh      - Refresh token
POST /api/auth/logout       - Logout

POST /api/admin/auth/login  - Admin login
GET  /api/admin/auth/me     - Get admin profile
```

#### Organizations
```
GET    /api/organizations           - List organizations
POST   /api/organizations           - Create organization
GET    /api/organizations/:id       - Get organization
PUT    /api/organizations/:id       - Update organization
DELETE /api/organizations/:id       - Delete organization
```

#### Invoices
```
GET    /api/invoices              - List invoices
POST   /api/invoices              - Create invoice
GET    /api/invoices/:id          - Get invoice
PUT    /api/invoices/:id          - Update invoice
DELETE /api/invoices/:id          - Delete invoice
POST   /api/invoices/:id/send     - Send invoice via email
GET    /api/invoices/:id/pdf      - Download PDF
```

#### Customers
```
GET    /api/customers             - List customers
POST   /api/customers             - Create customer
GET    /api/customers/:id         - Get customer
PUT    /api/customers/:id         - Update customer
DELETE /api/customers/:id         - Delete customer
```

#### Items/Products
```
GET    /api/items                 - List items
POST   /api/items                 - Create item
GET    /api/items/:id             - Get item
PUT    /api/items/:id             - Update item
DELETE /api/items/:id             - Delete item
```

### Response Format

#### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Rate Limiting

- **Window:** 15 minutes (900,000 ms)
- **Max Requests:** 100 per window
- **Headers:** 
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Reset timestamp

---

## 🚀 Deployment

### Docker Deployment (Recommended)

#### 1. Prepare Server

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Upload Files

```bash
# Using SCP
scp -r bizverse user@your-server:/home/user/

# Or using Git
git clone your-repository-url
cd bizverse
```

#### 3. Configure Environment

```bash
cd /home/user/bizverse
cp .env.example .env
nano .env  # Edit with production values
```

#### 4. Deploy

```bash
# Build and start
docker-compose up -d

# Check logs
docker-compose logs -f

# Initialize database
docker-compose exec app npm run db:push
```

#### 5. Setup SSL/HTTPS

Use Nginx as reverse proxy with Let's Encrypt:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

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

### Hostinger Deployment

1. **Upload Files:**
   - Use File Manager or FTP
   - Upload to public_html or custom directory

2. **Setup Node.js:**
   - Enable Node.js in Hostinger control panel
   - Select Node.js 22.x
   - Set entry file: `dist/index.js`

3. **Setup Database:**
   - Create PostgreSQL database in control panel
   - Note credentials
   - Update .env

4. **Deploy:**
   ```bash
   npm install
   npm run build
   npm start
   ```

### Ubuntu VPS Deployment

1. **Install Requirements:**
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm postgresql nginx certbot python3-certbot-nginx
   ```

2. **Setup Application:**
   ```bash
   cd /var/www
   git clone your-repo bizverse
   cd bizverse
   npm install
   npm run build
   ```

3. **Setup PM2:**
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name bizverse
   pm2 startup
   pm2 save
   ```

4. **Setup Nginx:**
   - Configure reverse proxy (see SSL section above)
   - Enable site
   - Restart Nginx

5. **Setup SSL:**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

---

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors

**Problem:** Cannot connect to database

**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection string in .env
DATABASE_URL=postgresql://user:password@localhost:5432/database

# Test connection
psql -U bizverse_user -d bizverse_db -h localhost
```

#### Port Already in Use

**Problem:** Port 5000 already in use

**Solution:**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=5001
```

#### Docker Issues

**Problem:** Container fails to start

**Solution:**
```bash
# View logs
docker-compose logs app

# Restart services
docker-compose restart

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### Email Not Sending

**Problem:** Emails not being delivered

**Solution:**
1. Verify Resend API key is correct
2. Check domain is verified in Resend
3. Verify DNS records (SPF, DKIM, DMARC)
4. Check application logs for errors
5. Test with Resend dashboard

#### Payment Gateway Errors

**Problem:** Payment not processing

**Solution:**
1. Verify merchant credentials are correct
2. Check if in test/production mode
3. Verify callback URL is accessible
4. Check webhook logs in gateway dashboard
5. Test with test cards/credentials first

### Debug Mode

Enable detailed logging:

```env
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
```

View logs:
```bash
# Docker
docker-compose logs -f app

# PM2
pm2 logs bizverse

# Direct
tail -f logs/app.log
```

---

## 📞 Support

### Get Help

- **Email:** hugenetwork7@gmail.com
- **Documentation:** [Link to docs]
- **Issues:** [GitHub Issues]
- **Community:** [Discord/Slack]

### Reporting Bugs

When reporting bugs, include:
1. Node.js and npm versions
2. PostgreSQL version
3. Error messages and stack traces
4. Steps to reproduce
5. Environment (development/production)
6. Relevant configuration (without secrets)

### Feature Requests

Submit feature requests with:
1. Use case description
2. Expected behavior
3. Current workaround (if any)
4. Priority level
5. Willingness to contribute

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ by Flying Venture System
- Powered by modern open-source technologies
- Community contributions welcome

---

## 🔄 Version History

### Version 1.0.0 (Current)
- Initial production release
- Complete billing and invoicing
- Inventory management
- CRM features
- Accounting module
- 20-day trial system
- PayUMoney integration
- Automated email notifications
- Docker support

---

## 🗺️ Roadmap

### Upcoming Features
- [ ] WhatsApp integration for notifications
- [ ] Mobile app (iOS/Android)
- [ ] Advanced analytics and BI dashboards
- [ ] Multi-currency support
- [ ] International payment gateways
- [ ] API marketplace
- [ ] Custom workflow automation
- [ ] Advanced role permissions
- [ ] Document management system
- [ ] Project management module

---

<div align="center">

**Made with ❤️ by Flying Venture System**

⭐ Star us on GitHub — it helps!

[Website](https://flyingventure.com) • [Documentation](https://docs.bizverse.com) • [Support](mailto:hugenetwork7@gmail.com)

</div>
