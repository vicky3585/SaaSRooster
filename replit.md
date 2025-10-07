# Bizverse - Multi-Tenant SaaS Billing & Accounting Portal

## Overview

Bizverse is a production-ready, multi-tenant SaaS billing and accounting portal for Indian businesses, ensuring GST compliance. It offers comprehensive financial management including invoicing, customer/vendor management, expense tracking, inventory, and GST reporting (GSTR-1, GSTR-3B). The application includes CRM, Support, and Accounting modules, with features like multi-GSTIN support, financial year management, AI-powered invoice email automation, and platform admin tools for user management.

## Recent Changes

### Quotation PDF Download Feature (October 2025)
- **Download Quotations as PDF**: Quotations can now be downloaded and viewed in PDF format
  - Download button added to quotations table with intuitive Download icon
  - Backend route `/api/invoices/:id/pdf` generates and serves actual PDF files
  - PDF filename automatically reflects document type: `quotation-{number}.pdf` for quotations, `invoice-{number}.pdf` for invoices
  - Uses html-pdf-node library with Puppeteer for high-quality PDF generation
  - Proper error handling and user feedback via toast notifications
  - Secure: Requires authentication and validates organization access

### Editable Invoice Numbers (October 2025)
- **Custom Invoice Numbers**: Invoice numbers are now fully editable during invoice creation
  - Auto-populated with next sequential number (e.g., "INV-2024-001")
  - Users can override with custom invoice numbers
  - Monospace font input for better readability
  - Backend accepts `invoiceNumber` in request body with auto-generation fallback
  - Form validation ensures invoice number is required
  - Supports both create and edit modes

### Indian State Selection & Intelligent GST Calculation (October 2025)
- **Place of Supply with State Codes**: Invoice creation now shows all Indian states with GST state codes
  - Dropdown format: "Code - State Name" (e.g., "29 - Karnataka", "27 - Maharashtra")
  - Complete coverage of all 38 Indian states and union territories with GST codes (01-38, 97)
  - Auto-populates from customer's billing state when customer is selected
  - Supports states stored as codes (e.g., "29") or names (e.g., "Karnataka")
  - Falls back to GSTIN extraction if billing state is not available
- **Intelligent GST Calculation**: Automatically determines tax type based on transaction
  - **Intra-State** (same state as organization): Applies CGST + SGST (50-50 split)
  - **Inter-State** (different state from organization): Applies IGST (full tax)
  - Uses organization state from `state` field or extracts from `gstin`
  - Correctly handles all state code formats for accurate tax calculation

### Admin Password Reset Feature (October 2025)
- **Platform Admin Password Reset**: Platform administrators can now reset passwords for organization users through the Admin Panel
  - Access via Admin Panel → Organizations → "Users" button → Select user → "Reset Password"
  - Includes proper dialog state management for managing multiple organizations
  - Security: Only platform_admin role can access, includes audit logging with IP and user agent tracking
  - API endpoint: `POST /api/admin/users/:userId/reset-password`

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:** React with TypeScript, Vite, Wouter for routing, shadcn/ui (Radix UI) for components, Tailwind CSS for styling, TanStack Query for server state, React Context for authentication, Recharts for data visualization, and React Hook Form with Zod for forms.

**Design System:** Custom color palette with light/dark mode, Inter font, monospace fonts for financial codes, professional data-focused aesthetic inspired by Stripe, consistent spacing and elevation.

**Component Structure:** Modular, reusable UI primitives, page-level components, context providers for Auth and Theme.

### Backend Architecture

**Technology Stack:** Node.js with Express.js, TypeScript, Drizzle ORM, PostgreSQL (Neon serverless driver), JWT-based authentication with bcrypt and HTTP-only cookies for refresh tokens.

**API Design:** RESTful, resource-based endpoints with middleware for authentication and organization isolation, centralized error handling, request/response logging.

**Multi-Tenancy:** Organization-based data isolation using `orgId` on all tenant-scoped tables, middleware enforcement, membership-based role permissions (owner, admin, accountant, viewer), and user organization switching.

**Security:** JWT access (15-min) and refresh tokens (7-day), hashed passwords (bcrypt), organization-level data isolation, Zod input validation, httpOnly cookies.

### Database Architecture

**Schema Design:** Core tables for users, organizations, memberships, and refresh tokens. Business domain tables for customers, leads, accounts, contacts, deals, activities, tasks, tickets, items, warehouses, invoices, payments, credit notes, expenses, stock transactions, chart of accounts, journals, and sequence counters.

**Key Design Decisions:** `orgId` for all tenant-scoped tables, UUID primary keys, `createdAt`/`updatedAt` for auditing, JSONB for flexible metadata, and enum types for data integrity.

## External Dependencies

### Third-Party Services

*   **Neon PostgreSQL:** Serverless PostgreSQL database (via `DATABASE_URL`).
*   **Resend:** Transactional email delivery (via `RESEND_API_KEY`).
*   **OpenAI:** AI services for email content generation (via `OPENAI_API_KEY`).
*   **html-pdf-node:** HTML to PDF generation library.

### NPM Packages

*   **Core Framework:** `express`, `react`, `react-dom`, `vite`, `typescript`, `tsx`.
*   **Database & ORM:** `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`, `ws`.
*   **Authentication & Security:** `bcryptjs`, `jsonwebtoken`, `cookie-parser`.
*   **UI Components:** `@radix-ui/*`, `tailwindcss`, `recharts`, `lucide-react`.
*   **Forms & Validation:** `react-hook-form`, `@hookform/resolvers`, `zod`, `drizzle-zod`.
*   **State Management & Routing:** `@tanstack/react-query`, `wouter`.
*   **Utilities:** `class-variance-authority`, `clsx`, `tailwind-merge`, `nanoid`.

### Environment Configuration

Required: `DATABASE_URL`, `JWT_SECRET`, `REFRESH_SECRET`, `NODE_ENV`, `RESEND_API_KEY`, `OPENAI_API_KEY`.