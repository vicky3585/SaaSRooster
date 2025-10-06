# Design Guidelines: Multi-Tenant SaaS Billing + Accounting Portal

## Design Approach: Data-Focused Professional System

**Framework**: Material Design + Stripe Dashboard Aesthetics  
**Rationale**: Financial applications demand clarity, trust, and efficiency. Material Design's structured patterns combined with Stripe's refined data presentation create a professional, trustworthy interface optimized for complex financial workflows.

**Core Principles**:
- Data clarity over decoration - every pixel serves a purpose
- Trustworthy professionalism through consistent patterns
- Efficient workflows with minimal cognitive load
- Predictable interactions for power users

---

## Color Palette

### Light Mode
- **Primary**: 222 47% 41% (Navy blue - trust, stability)
- **Secondary**: 215 16% 47% (Slate - secondary actions)
- **Success**: 142 71% 45% (Financial green - profits, paid status)
- **Destructive**: 0 72% 51% (Errors, overdue payments)
- **Warning**: 38 92% 50% (Pending approvals, alerts)
- **Background**: 0 0% 100% (Clean white)
- **Card**: 0 0% 98% (Subtle elevation)
- **Border**: 214 32% 91% (Light separators)
- **Muted**: 210 40% 96% (Secondary backgrounds)

### Dark Mode
- **Primary**: 222 47% 65%
- **Secondary**: 215 16% 65%
- **Success**: 142 71% 55%
- **Background**: 222 47% 11%
- **Card**: 222 47% 15%
- **Border**: 215 27% 25%

---

## Typography

**Fonts** (Google Fonts CDN):
- **Primary**: Inter - All UI text, optimized for screens
- **Monospace**: 'Courier New' - Invoice numbers, GST IDs, transaction codes

**Hierarchy**:
- **Page Titles**: text-3xl (30px) font-bold
- **Section Headers**: text-2xl (24px) font-semibold
- **Card Titles**: text-xl (20px) font-semibold
- **Body**: text-base (16px) for content, text-sm (14px) for labels
- **Financial Data**: text-lg (18px) font-semibold for amounts, font-mono for codes
- **Metadata**: text-xs (12px) for timestamps, helper text

---

## Layout System

**Spacing Units**: 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section gaps: gap-6 to gap-8  
- Card spacing: space-y-6
- Page containers: px-6 to px-8, max-w-7xl mx-auto

**Grid Patterns**:
- Dashboard KPIs: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Data tables: Full-width within container
- Forms: Single column max-w-2xl for data entry
- Reports: Two-column (filters + results)

---

## Component Library

### Navigation

**Left Sidebar** (fixed, 256px desktop):
- Dark slate-900 background with logo at top
- Organization switcher dropdown below logo
- Menu items: Heroicons outline icons + text-sm labels
- Active state: bg-primary rounded-md text-white
- Hover: bg-slate-800 transition-colors duration-150
- Collapses to icon-only on tablet

**Top Bar**:
- Fixed with backdrop-blur-sm border-b
- Breadcrumbs/page title (hidden when sidebar visible)
- Right: Notification bell icon + user avatar dropdown

### Dashboard Cards

**KPI Cards**:
- White/card background, border, rounded-lg shadow-sm
- Colored icon circle (primary/success/destructive tint)
- Value: text-3xl font-bold
- Label: text-sm text-muted-foreground
- Trend badge: Small pill with ↑/↓ + percentage change
- Height: h-32, responsive padding p-6

**Quick Actions Card**:
- Grid of 4 large icon buttons
- Each button: Column layout with icon + label
- Actions: Create Invoice, Add Customer, Record Payment, New Expense
- Hover: bg-accent transition

### Data Tables

**Structure**:
- Striped rows with hover:bg-muted/50
- Header: bg-muted font-semibold text-sm uppercase tracking-wide
- Cell padding: px-4 py-3, align-middle
- Row height: h-12 for touch targets
- Sortable columns with sort indicators

**Status Badges**:
- Paid: bg-green-100 text-green-800 (dark: bg-green-900/30 text-green-400)
- Overdue: bg-red-100 text-red-800
- Draft: bg-gray-100 text-gray-800
- Pending: bg-yellow-100 text-yellow-800
- Style: rounded-full px-2.5 py-0.5 text-xs font-medium

**Actions Column**:
- ⋮ icon button (ghost variant)
- Dropdown menu: Edit, View, Download, Delete options
- Menu: bg-background shadow-lg border rounded-md

**Pagination**:
- Bottom center alignment
- Previous/Next buttons + page numbers
- Active page: bg-primary text-white
- Shows "X-Y of Z results"

### Charts (Recharts)

**Revenue vs Expenses Bar Chart**:
- Grouped bars: primary (revenue) + destructive (expenses)
- Grid: stroke-muted strokeDasharray="3 3"
- Tooltip: White card shadow-md with formatted values
- Height: h-80, responsive container

**Profit Trend Line Chart**:
- Smooth curve with area gradient fill (primary @ 20% opacity)
- Dot markers on data points
- X-axis: Monthly labels, Y-axis: Currency formatted

**Customer Distribution Pie**:
- 6-color palette from primary/secondary variants
- Legend: Right side (desktop), bottom (mobile)
- Center label: Total customer count

### Forms

**Input Fields**:
- Border: border-input rounded-md
- Padding: px-3 py-2, text-base
- Focus: ring-2 ring-primary ring-offset-2
- Labels: text-sm font-medium mb-1.5
- Helper text: text-xs text-muted-foreground mt-1
- Error: border-destructive + error message below

**Select/Dropdowns**:
- Chevron-down icon right-aligned
- Menu: shadow-md border max-h-60 overflow-auto
- Selected: bg-muted

**Date Picker**:
- Calendar icon trigger button
- Popover calendar with month/year navigation
- Selected date: bg-primary text-white rounded-md

**Invoice Line Items Table**:
- Editable rows with add/remove buttons
- Columns: Item, Description, Quantity, Rate, Tax, Amount
- Auto-calculation on value changes
- Subtotal/Tax/Total footer section

### Buttons

**Variants**:
- Primary: bg-primary text-white hover:bg-primary/90
- Secondary: bg-secondary text-secondary-foreground
- Outline: border border-input bg-background hover:bg-accent
- Ghost: hover:bg-accent (icon buttons, table actions)
- Destructive: bg-destructive text-destructive-foreground

**Sizes**: sm (px-3 py-1.5 text-sm), default (px-4 py-2), lg (px-6 py-3)

### Dialogs & Modals

- Overlay: bg-black/50 backdrop-blur-sm
- Content: bg-background rounded-lg shadow-xl max-w-2xl p-6
- Header: text-xl font-semibold with close X button
- Body: space-y-4 content
- Footer: border-t pt-4 with Cancel (outline) + Confirm (primary) buttons

### Toast Notifications

- Position: Fixed bottom-right
- Success: border-l-4 border-success with checkmark icon
- Error: border-l-4 border-destructive with alert icon
- Auto-dismiss: 5s with animated progress bar
- Close button top-right

---

## Page-Specific Layouts

### Dashboard
- Grid of 4 KPI cards (Revenue, Expenses, Profit, Outstanding)
- Two-chart row: Revenue vs Expenses bar + Profit trend line
- Bottom row: Customer distribution pie + Recent Activity timeline card
- Quick Actions card: 4 prominent action buttons

### Invoice Management
- Top: Search bar + Status filter pills + Date range picker
- Table: Sortable columns (Invoice #, Customer, Date, Amount, Status)
- Empty state: Centered illustration + "Create your first invoice" CTA
- Batch actions: Select multiple for bulk email/download

### Invoice Create/Edit
- Two-column desktop layout
- Left: Form fields (customer select, dates, terms, notes)
- Right: Live preview panel (read-only, mirrors left changes)
- Center: Line items editable table
- Tax breakdown: CGST/SGST/IGST calculation display
- Footer: Grand total (text-2xl font-bold) + Save Draft/Send buttons

### Reports
- Left: Report type cards (GST Returns, P&L, Cash Flow, etc.)
- Main: Date range + filter controls
- Results: Table or chart based on type
- Export buttons: PDF, CSV, Excel (outline buttons)
- Print-optimized styles

### Settings
- Tab navigation: Company, Users, Tax Settings, Preferences
- Company: Logo upload (drag-drop 200x80px), business details form
- Tax Settings: GST registration number, tax rates, HSN codes table
- Form sections with clear dividers
- Sticky save button at bottom

---

## Images

**Logo Usage**:
- Left sidebar top: 200px width on white/transparent background
- Invoice PDFs: Top-left 150px width
- Settings page: Upload area 200x80px with preview

**Empty States**:
- Centered line illustrations (Undraw.co style)
- Use for: No invoices, No customers, No transactions
- Include heading + description + CTA button below
- 404/Error pages: Friendly illustration with "Return to Dashboard" link

**No Hero Images**: This is a utility dashboard - users see data-rich dashboard immediately after login, not marketing imagery.

---

## Animations

**Minimal, Purposeful Motion**:
- Hover states: transition-colors duration-150
- Dropdown menus: Slide down duration-200 ease-out
- Chart rendering: Recharts default (first load only)
- Loading: Shimmer skeleton for tables, spinner for actions
- Page transitions: None (instant, snappy)

**Avoid**: Scroll effects, parallax, decorative animations that slow workflows

---

This design delivers a professional, trustworthy financial platform where clarity, efficiency, and data accuracy are paramount. Every element serves the user's financial management needs with zero decorative bloat.