# BillSync - Multi-Tenant SaaS Billing & Accounting Portal

## Overview

BillSync is a production-ready, multi-tenant SaaS billing and accounting portal designed specifically for Indian businesses with GST compliance. The application provides comprehensive financial management capabilities including invoicing, customer management, expense tracking, inventory management, and GST-compliant reporting.

**Key Features:**
- Multi-tenant architecture with organization-based isolation
- GST-compliant invoicing and reporting (GSTR-1, GSTR-3B)
- Customer and vendor management with GSTIN validation
- Inventory management with stock tracking
- Payment tracking and accounts receivable aging
- Credit/debit notes management
- Comprehensive financial reports and analytics
- Role-based access control (Owner, Admin, Accountant, Viewer)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React with TypeScript, using Wouter for client-side routing
- **Build Tool:** Vite with hot module replacement in development
- **UI Library:** shadcn/ui components built on Radix UI primitives
- **Styling:** Tailwind CSS with custom design system following Material Design principles
- **State Management:** TanStack Query (React Query) for server state, React Context for authentication
- **Charts:** Recharts for data visualization
- **Forms:** React Hook Form with Zod validation

**Design System:**
- Custom color palette with light/dark mode support
- Inter font family for all UI text
- Monospace fonts for financial codes and identifiers
- Professional, data-focused aesthetic inspired by Stripe Dashboard
- Consistent spacing and elevation patterns

**Component Structure:**
- Modular component architecture with reusable UI primitives
- Separate components for KPI cards, charts, tables, and forms
- Page-level components for main application views
- Context providers for cross-cutting concerns (Auth, Theme)

**Rationale:** React provides a mature ecosystem with excellent TypeScript support. Vite offers fast development builds and optimal production bundles. The combination of shadcn/ui and Radix UI provides accessible, customizable components while maintaining design consistency. TanStack Query simplifies server state management with built-in caching and synchronization.

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with Express.js HTTP server
- **Language:** TypeScript with ES modules
- **ORM:** Drizzle ORM for type-safe database queries
- **Database:** PostgreSQL (Neon serverless driver)
- **Authentication:** JWT-based with bcrypt password hashing
- **Session Management:** HTTP-only cookies for refresh tokens

**API Design:**
- RESTful API structure with resource-based endpoints
- Middleware-based authentication and organization isolation
- Centralized error handling
- Request/response logging for API routes

**Multi-Tenancy Implementation:**
- Organization-based data isolation with `orgId` on all tenant-scoped tables
- Middleware enforcement of organization context on all protected routes
- Membership-based role permissions (owner, admin, accountant, viewer)
- User can belong to multiple organizations with organization switching capability

**Security Measures:**
- JWT access tokens (15-minute expiry) and refresh tokens (7-day expiry)
- Hashed refresh tokens stored in database
- Password hashing with bcrypt
- Organization-level data isolation enforced at middleware layer
- Input validation using Zod schemas
- Cookie-based authentication with httpOnly flag

**Rationale:** Express provides a minimal, flexible foundation for building APIs. Drizzle ORM offers excellent TypeScript support with zero runtime overhead and direct SQL generation. The multi-tenant architecture ensures complete data isolation between organizations while allowing users to access multiple organizations. JWT-based authentication provides stateless authentication suitable for horizontal scaling.

### Database Architecture

**Schema Design:**

**Core Tables:**
- `users` - User accounts with email/password authentication
- `organizations` - Tenant organizations with company details and GST information
- `memberships` - Junction table linking users to organizations with roles
- `refresh_tokens` - Secure token storage for session management

**Business Domain Tables:**
- `customers` - Customer records with billing/shipping addresses and GST details
- `items` - Products/services with pricing, HSN/SAC codes, and tax rates
- `warehouses` - Inventory locations for multi-warehouse support
- `invoices` - Invoice headers with customer, dates, and totals
- `invoice_items` - Line items for invoices
- `payments` - Payment records linked to invoices
- `credit_notes` - Credit/debit notes for returns and adjustments
- `expenses` - Expense tracking with categorization
- `stock_transactions` - Inventory movement history (purchase, sale, adjustment, GRN)
- `sequence_counters` - Auto-incrementing invoice/document numbers per organization

**Key Design Decisions:**
- Every tenant-scoped table includes `orgId` for data isolation
- Soft deletes not implemented (hard deletes used for simplicity)
- JSONB fields for flexible metadata storage (tax breakdowns, addresses)
- Enum types for status fields to ensure data integrity
- UUID primary keys for all tables
- Timestamp fields (`createdAt`, `updatedAt`) for audit trails

**Rationale:** The schema follows normalized database design principles while using PostgreSQL-specific features like enums and JSONB. The organization-scoped design ensures complete tenant isolation. Separate tables for invoices and invoice items follow standard accounting practices and allow for flexible line item management.

## External Dependencies

### Third-Party Services

**Database:**
- **Neon PostgreSQL** - Serverless PostgreSQL database with websocket support
- Connection managed through connection pooling
- Environment variable: `DATABASE_URL`

**Development Tools:**
- **Replit Vite Plugins** - Development banner and cartographer for Replit environment
- Runtime error overlay for enhanced debugging

### NPM Packages

**Core Framework:**
- `express` - HTTP server framework
- `react`, `react-dom` - UI framework
- `vite` - Build tool and development server
- `typescript`, `tsx` - Type safety and execution

**Database & ORM:**
- `drizzle-orm` - Type-safe ORM
- `drizzle-kit` - Schema migrations
- `@neondatabase/serverless` - Neon database driver
- `ws` - WebSocket client for Neon

**Authentication & Security:**
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation/verification
- `cookie-parser` - Cookie parsing middleware

**UI Components:**
- `@radix-ui/*` - Accessible UI primitives (20+ packages)
- `tailwindcss` - Utility-first CSS framework
- `recharts` - Charting library
- `lucide-react` - Icon library

**Forms & Validation:**
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Form validation resolvers
- `zod` - Schema validation
- `drizzle-zod` - Drizzle-to-Zod schema generation

**State Management:**
- `@tanstack/react-query` - Server state management
- `wouter` - Lightweight routing

**Utilities:**
- `class-variance-authority` - Component variant management
- `clsx`, `tailwind-merge` - Class name utilities
- `nanoid` - Unique ID generation

### Environment Configuration

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for access token signing
- `REFRESH_SECRET` - Secret for refresh token signing
- `NODE_ENV` - Environment mode (development/production)

**Rationale:** The dependency choices prioritize type safety, developer experience, and production readiness. Neon provides serverless PostgreSQL that scales automatically. The authentication approach uses industry-standard JWT patterns. The UI component library provides accessibility out of the box while remaining customizable. All major dependencies are actively maintained with strong TypeScript support.