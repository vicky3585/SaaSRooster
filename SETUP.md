# Bizverse SaaS - Setup Guide

## ✅ Current Status

The Bizverse SaaS application has been **fully restored and is running successfully**!

- ✅ Database: PostgreSQL configured and migrated
- ✅ Authentication: JWT-based authentication system active
- ✅ Subscriptions: 4 subscription plans created (Free, Basic, Pro, Enterprise)
- ✅ Admin Account: Created and ready to use
- ✅ Payment Gateway: PayUMoney integration configured
- ✅ Email Service: Resend API configured
- ✅ Docker: Full Docker setup ready
- ✅ Security: Rate limiting, CORS, and Helmet configured
- ✅ Server: Running on http://localhost:5000

## 🔑 Admin Credentials

**Platform Admin Access:**
- **Email:** hugenetwork7@gmail.com
- **Password:** admin123
- **Login URL:** http://localhost:5000/admin/login

⚠️ **Important:** Change the admin password after first login!

## 🚀 Quick Start

### Running the Application

The application is currently running. If you need to restart it:

```bash
cd /home/ubuntu/code_artifacts/bizverse
./start-dev.sh
```

Or manually:

```bash
cd /home/ubuntu/code_artifacts/bizverse
export $(cat .env | grep -v '^#' | xargs)
npm run dev
```

### Access Points

- **Main Application:** http://localhost:5000
- **API Health Check:** http://localhost:5000/api/health
- **Admin Panel:** http://localhost:5000/admin
- **User Registration:** http://localhost:5000/auth/signup
- **User Login:** http://localhost:5000/auth/login

## 📊 Subscription Plans

| Plan | Monthly Price | Features |
|------|--------------|----------|
| **Free** | ₹0 | 10 invoices/month, 1 user, 1 warehouse, 50 customers, 1GB storage |
| **Basic** | ₹999 | Unlimited invoices, 5 users, 5 warehouses, 500 customers, 10GB storage |
| **Pro** | ₹2,499 | CRM, Advanced accounting, 20 users, 20 warehouses, 2000 customers, 50GB storage |
| **Enterprise** | ₹4,999 | Unlimited everything, White-label, Custom integrations, SLA guarantee |

All plans include 20-day free trial!

## 🗄️ Database Configuration

**Database Details:**
- Host: localhost
- Port: 5432
- Database: bizverse_db
- User: bizverse_user
- Password: bizverse_secure_password_2024

**Connection String:**
```
postgresql://bizverse_user:bizverse_secure_password_2024@localhost:5432/bizverse_db
```

### Database Management

Access the database via command line:
```bash
psql -U bizverse_user -d bizverse_db
```

Or use Adminer (included in Docker):
```bash
# Start Adminer (dev only)
docker-compose --profile dev up adminer -d
# Access at http://localhost:8080
```

## 🔧 Environment Configuration

The `.env` file is already configured with:

### ✅ Configured Services:
- Database connection
- JWT secrets for authentication
- Admin account credentials
- Trial period (20 days)
- Email settings (Resend API)
- Payment gateway (PayUMoney)
- Security settings (rate limiting, CORS)

### 🔑 Services Requiring API Keys:

**1. Email Service (Resend API):**
- Get API key from: https://resend.com/api-keys
- Update in `.env`: `RESEND_API_KEY=re_your_key_here`
- Update sender email: `FROM_EMAIL=invoices@yourdomain.com`

**2. PayUMoney Payment Gateway:**
- Get credentials from: https://www.payumoney.com
- Update in `.env`:
  - `PAYUMONEY_MERCHANT_KEY=your_key`
  - `PAYUMONEY_MERCHANT_SALT=your_salt`

**3. Optional: Razorpay**
- Get from: https://dashboard.razorpay.com/app/keys
- Update in `.env`:
  - `RAZORPAY_KEY_ID=your_key_id`
  - `RAZORPAY_KEY_SECRET=your_secret`

**4. Optional: Stripe**
- Get from: https://dashboard.stripe.com/apikeys
- Update in `.env`:
  - `STRIPE_PUBLISHABLE_KEY=pk_test_...`
  - `STRIPE_SECRET_KEY=sk_test_...`

**5. Optional: OpenAI (for AI features)**
- Get from: https://platform.openai.com/api-keys
- Update in `.env`: `OPENAI_API_KEY=sk-...`

## 🐳 Docker Deployment

### Start with Docker Compose

```bash
cd /home/ubuntu/code_artifacts/bizverse
docker-compose up -d
```

This will start:
- PostgreSQL database
- Bizverse application
- Adminer (database admin, dev profile only)

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# Start with Adminer (dev)
docker-compose --profile dev up -d
```

### Access Docker Services

- Application: http://localhost:5000
- Adminer: http://localhost:8080 (dev profile)
- PostgreSQL: localhost:5432

## 📝 Database Initialization Scripts

Two initialization scripts are available:

### 1. Create Platform Admin
```bash
cd /home/ubuntu/code_artifacts/bizverse
export $(cat .env | grep -v '^#' | xargs)
npx tsx server/scripts/createPlatformAdmin.ts
```

### 2. Initialize Subscription Plans
```bash
cd /home/ubuntu/code_artifacts/bizverse
export $(cat .env | grep -v '^#' | xargs)
npx tsx server/scripts/initSubscriptionPlans.ts
```

Both scripts have already been run successfully!

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type checking
npm run check

# Database migration
npm run db:push

# Build for production
npm run build

# Start production server
npm run start
```

## 📦 Features Implemented

### ✅ Authentication & Authorization
- JWT-based authentication
- Refresh token mechanism
- Role-based access control (Platform Admin, Org Admin, Staff, Viewer)
- Password hashing with bcrypt
- Rate limiting on auth endpoints

### ✅ Multi-Tenancy
- Organization-based data isolation
- Multi-organization support per user
- Organization membership management
- Role-based permissions per organization

### ✅ Subscription Management
- 20-day free trial for new organizations
- 4 subscription plans with different limits
- Automatic trial expiration tracking
- Trial warning notifications
- Subscription upgrade/downgrade

### ✅ Payment Integration
- PayUMoney payment gateway
- Razorpay support (optional)
- Stripe support (optional)
- Payment transaction tracking
- Payment webhook handling
- Payment success/failure notifications

### ✅ Email Notifications
- Welcome emails on registration
- Invoice emails (sales & purchase)
- Payment confirmation emails
- Monthly sales summary
- Monthly purchase summary
- Trial expiration warnings
- Powered by Resend API

### ✅ Business Features
- **Invoicing:** Create, send, track invoices with GST compliance
- **Inventory:** Multi-warehouse stock management
- **CRM:** Leads, deals, activities, tasks management
- **Accounting:** Chart of accounts, journals, financial reports
- **Purchase Management:** Purchase orders and invoices
- **Expense Tracking:** Category-based expense management
- **Customer Management:** Comprehensive customer database
- **Vendor Management:** Supplier and vendor tracking

### ✅ UI/UX
- Modern, responsive dashboard
- Professional UI with Tailwind CSS
- Radix UI components
- Dark mode support (via next-themes)
- Mobile-friendly design
- Real-time updates with React Query

### ✅ Security
- Rate limiting (100 requests per 15 min, 5 login attempts)
- CORS protection
- Helmet security headers
- XSS protection
- CSRF protection
- SQL injection prevention (Drizzle ORM)
- Secure password storage
- JWT token expiration

### ✅ DevOps
- Docker containerization
- Docker Compose orchestration
- Health check endpoints
- Graceful shutdown
- Environment-based configuration
- Automated database migrations
- Database backup support

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Admin
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/users` - List all users
- `GET /api/admin/organizations` - List all organizations
- `GET /api/admin/subscription-plans` - Manage subscription plans

### Organizations
- `GET /api/organizations` - List user's organizations
- `POST /api/organizations` - Create new organization
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization

### Subscriptions
- `GET /api/subscription-payments/plans` - Get subscription plans
- `POST /api/subscription-payments/create-payment` - Initiate payment
- `POST /api/subscription-payments/verify-payment` - Verify payment

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `POST /api/invoices/:id/send` - Send invoice via email

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Items & Inventory
- `GET /api/items` - List items
- `POST /api/items` - Create item
- `GET /api/warehouses` - List warehouses
- `GET /api/stock-transactions` - Stock movements

### CRM
- `GET /api/leads` - List leads
- `GET /api/deals` - List deals
- `GET /api/activities` - List activities
- `GET /api/tasks` - List tasks

### Reports
- `GET /api/dashboard` - Dashboard statistics
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/purchases` - Purchase reports
- `GET /api/reports/inventory` - Inventory reports

## 🔍 Testing the Application

### 1. Test Health Check
```bash
curl http://localhost:5000/api/health
```

### 2. Admin Login
```bash
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hugenetwork7@gmail.com","password":"admin123"}'
```

### 3. Get Subscription Plans
```bash
curl http://localhost:5000/api/subscription-payments/plans
```

### 4. User Registration
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"password123",
    "name":"Test User",
    "orgName":"Test Organization"
  }'
```

## 📈 Monitoring & Logs

### Application Logs
```bash
# View live logs (if using Docker)
docker-compose logs -f app

# View dev server logs
tail -f /tmp/server.log
```

### Database Logs
```bash
# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### Health Check
```bash
# Check application health
curl http://localhost:5000/api/health

# Check database connection
psql -U bizverse_user -d bizverse_db -c "SELECT 1;"
```

## 🚨 Troubleshooting

### Application won't start
```bash
# Check if port 5000 is in use
netstat -tuln | grep 5000

# Kill process on port 5000
sudo fuser -k 5000/tcp

# Check environment variables
cd /home/ubuntu/code_artifacts/bizverse
cat .env | grep DATABASE_URL
```

### Database connection error
```bash
# Check PostgreSQL status
sudo service postgresql status

# Restart PostgreSQL
sudo service postgresql restart

# Test connection
psql -U bizverse_user -d bizverse_db -c "SELECT 1;"
```

### Port conflicts
```bash
# Change port in .env
PORT=3000

# Or use environment variable
PORT=3000 ./start-dev.sh
```

### TypeScript errors
```bash
# Install missing dependencies
npm install

# Check types
npm run check
```

## 📚 Additional Resources

- **Project Repository:** /home/ubuntu/code_artifacts/bizverse
- **Environment Config:** .env
- **Environment Template:** .env.example
- **Docker Config:** docker-compose.yml
- **Database Config:** drizzle.config.ts
- **Main README:** README.md

## 🎯 Next Steps

1. **Configure Email Service:**
   - Get Resend API key
   - Verify sender domain
   - Update .env with credentials

2. **Configure Payment Gateway:**
   - Choose payment provider (PayUMoney/Razorpay/Stripe)
   - Get merchant credentials
   - Update .env and test payments

3. **Customize Branding:**
   - Update organization name
   - Add logo
   - Customize email templates
   - Modify color scheme

4. **Production Deployment:**
   - Set NODE_ENV=production
   - Use strong passwords
   - Configure SSL/HTTPS
   - Set up backup automation
   - Configure domain and DNS
   - Enable monitoring

5. **Security Hardening:**
   - Change admin password
   - Rotate JWT secrets
   - Enable 2FA (if implementing)
   - Set up firewall rules
   - Configure rate limiting

## 📞 Support

- **Admin Email:** hugenetwork7@gmail.com
- **System Name:** Flying Venture System
- **Application:** Bizverse SaaS

---

## 🎉 Success! Your Application is Ready!

Access your application at: **http://localhost:5000**

Admin Panel: **http://localhost:5000/admin/login**

Happy building! 🚀
