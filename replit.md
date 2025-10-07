# Ledgix - Multi-Tenant SaaS Billing & Accounting Portal

## Overview

Ledgix (Ledger + Logic) is a production-ready, multi-tenant SaaS billing and accounting portal for Indian businesses, ensuring GST compliance. It offers comprehensive financial management including invoicing, customer/vendor management, expense tracking, inventory, and GST reporting (GSTR-1, GSTR-3B). The application includes CRM, Support, and Accounting modules, with features like multi-GSTIN support, financial year management, and AI-powered invoice email automation.

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