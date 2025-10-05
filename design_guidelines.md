# Design Guidelines: Multi-Tenant SaaS Billing + Accounting Portal

## Design Approach: Professional Data-Focused System

**Selected Framework**: Material Design + Stripe Dashboard aesthetics  
**Rationale**: Financial applications demand clarity, trust, and efficiency. We're blending Material Design's structured approach with Stripe's refined data presentation for a professional, trustworthy interface.

**Core Principles**:
- Data clarity over decoration
- Trustworthy professionalism
- Efficient workflows
- Consistent, predictable patterns

---

## Color Palette

### Light Mode
- **Primary**: 222 47% 41% (Professional navy blue for trust/stability)
- **Secondary**: 215 16% 47% (Muted slate for secondary elements)
- **Success**: 142 71% 45% (Financial green for positive metrics, profits)
- **Destructive**: 0 72% 51% (Error states, overdue indicators)
- **Warning**: 38 92% 50% (Alert states, pending approvals)
- **Background**: 0 0% 100% (Clean white)
- **Card**: 0 0% 98% (Subtle off-white for elevation)
- **Border**: 214 32% 91% (Light gray borders)
- **Muted**: 210 40% 96% (Backgrounds for secondary content)

### Dark Mode
- **Primary**: 222 47% 65%
- **Secondary**: 215 16% 65%
- **Success**: 142 71% 55%
- **Background**: 222 47% 11%
- **Card**: 222 47% 15%
- **Border**: 215 27% 25%

---

## Typography

**Font Families**:
- **Primary**: Inter (Google Fonts) - All UI text, clean and readable at all sizes
- **Monospace**: 'Courier New' - Invoice numbers, GST numbers, financial codes

**Scale**:
- **Headings**: text-3xl (30px) for page titles, text-2xl (24px) for section headers, text-xl (20px) for card titles
- **Body**: text-base (16px) for primary content, text-sm (14px) for labels/metadata
- **Small**: text-xs (12px) for timestamps, helper text, badges
- **Financial Data**: text-lg (18px) with font-semibold for amounts, font-mono for codes

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16  
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card gaps: gap-4 to gap-6
- Page margins: px-6 to px-8

**Grid Structure**:
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Data tables: Full width within max-w-7xl container
- Forms: Single column max-w-2xl for optimal data entry
- Reports page: Two-column split (filters + results)

---

## Component Library

### Navigation
**Left Sidebar** (fixed, 240px width on desktop):
- Dark background (slate-900 in light mode, slate-950 in dark)
- Logo at top with organization name below
- Menu items with icons (Heroicons outline), text-sm
- Active state: bg-primary with rounded-md, text-white
- Hover: bg-slate-800 transition
- Collapsible to icon-only on tablet
- Organization switcher dropdown at top

**Top Bar**:
- Fixed, backdrop-blur-sm with border-b
- Right side: notifications bell, user avatar dropdown
- Page title/breadcrumbs on left (mobile) or hidden when sidebar visible

### Dashboard Cards
**KPI Cards** (Revenue, Expenses, Profit, Outstanding):
- White/card background with border
- Icon in colored circle (primary/success/destructive tint)
- Large number: text-3xl font-bold
- Label: text-sm text-muted-foreground
- Trend indicator: small badge with ↑/↓ and percentage
- Height: h-32, rounded-lg shadow-sm

### Charts (Recharts)
**Bar Chart** (Revenue vs Expenses):
- Two-tone bars: primary for revenue, destructive for expenses
- Grid lines: stroke-muted, strokeDasharray="3 3"
- Tooltip: White card with shadow-md
- Height: h-80, responsive width

**Line Chart** (Profit Trend):
- Smooth curve with gradient fill
- Area fill: primary color with 20% opacity
- Dot markers on data points
- X-axis: Monthly labels (Jan, Feb, Mar...)

**Pie Chart** (Customer Distribution):
- 5-6 segment colors from primary palette
- Legend: right side on desktop, bottom on mobile
- Center label showing total count

### Tables (Invoices, Customers, Items)
- Striped rows with hover:bg-muted/50
- Header: bg-muted font-semibold text-sm
- Cell padding: px-4 py-3
- Status badges: rounded-full px-2.5 py-0.5 text-xs (paid: green, overdue: red, draft: gray)
- Actions column: ⋮ dropdown menu (Edit, View, Delete)
- Pagination: Bottom center with page numbers + Previous/Next
- Row height: h-12 for comfortable touch targets

### Forms
**Input Fields**:
- Border: border-input rounded-md
- Padding: px-3 py-2
- Focus: ring-2 ring-primary
- Labels: text-sm font-medium mb-1.5
- Helper text: text-xs text-muted-foreground mt-1
- Error state: border-destructive with error message

**Select/Dropdown**:
- Chevron icon on right
- Dropdown menu: shadow-md border with max-h-60 overflow-y-auto

**Date Picker**:
- Calendar icon button
- Popover calendar with month/year navigation
- Selected date: bg-primary text-white

### Buttons
**Primary**: bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md  
**Secondary**: bg-secondary text-secondary-foreground  
**Outline**: border border-input bg-background hover:bg-accent  
**Ghost**: hover:bg-accent (for icon buttons, table actions)  
**Destructive**: bg-destructive text-destructive-foreground

Size variants: sm (px-3 py-1.5 text-sm), default (px-4 py-2), lg (px-6 py-3 text-lg)

### Dialogs & Modals
- Overlay: bg-black/50 backdrop-blur-sm
- Content: bg-background rounded-lg shadow-lg max-w-2xl
- Header: border-b pb-4 with close X button
- Footer: border-t pt-4 with action buttons (Cancel + Confirm)
- Padding: p-6

### Badges & Status Indicators
- Paid: bg-green-100 text-green-800 (dark: bg-green-900/30 text-green-400)
- Overdue: bg-red-100 text-red-800
- Draft: bg-gray-100 text-gray-800
- Pending: bg-yellow-100 text-yellow-800
- Rounded-full, px-2 py-1, text-xs font-medium

### Toast Notifications
- Bottom-right corner (fixed)
- Success: border-l-4 border-green-500
- Error: border-l-4 border-red-500
- Auto-dismiss after 5s with progress bar
- Close button (X icon)

---

## Page-Specific Layouts

### Dashboard
- Page title: "Dashboard" text-3xl font-bold mb-6
- KPI cards grid (4 columns on desktop)
- Below: Two charts side-by-side (Revenue vs Expenses + Profit Trend)
- Third row: Customer Distribution pie chart + Recent Activity list card
- Quick Actions card: 4 large icon buttons (Create Invoice, Add Customer, Record Payment, New Expense)

### Invoice List/Table Pages
- Search bar + Filters row (Status, Date range, Customer)
- Table with sortable columns
- Empty state: Centered illustration with "No invoices yet" + CTA button

### Invoice Create/Edit Form
- Two-column layout on desktop
- Left: Invoice details (customer, date, due date, terms)
- Right: Preview panel (read-only, updates live)
- Line items table: Add/remove rows dynamically
- Tax calculation section: Shows CGST/SGST/IGST breakdown
- Footer: Total in large text-2xl font-bold
- Actions: Save as Draft, Send Invoice (primary button)

### Reports Page
- Left sidebar: Report type selector (cards with icons)
- Main area: Date range picker + filters
- Export buttons: Download PDF, Export CSV/JSON
- Results table or chart based on report type
- Print-optimized layout

### Settings Pages
- Tab navigation (Company, Users, Billing, Preferences)
- Form sections with clear headings
- Logo upload: Drag-drop zone with preview
- Save changes button: Sticky at bottom on scroll

---

## Images

**Logo Placement**: 
- Top of left sidebar (200px width)
- Invoice PDFs (top-left, 150px width)
- Settings page (profile section, 120px square)

**Empty States**: Use simple line illustrations (from undraw.co or similar) for:
- No invoices/customers/items states (center of page)
- Welcome screen after signup (with mascot/illustration)
- 404/error pages

**Hero Image**: None - This is a utility-focused dashboard application. Replace traditional hero with data-rich dashboard immediately after login.

---

## Animations

**Minimal Motion**:
- Page transitions: None (instant)
- Hover states: transition-colors duration-150
- Dropdown menus: slide down with duration-200
- Chart rendering: Recharts default animation (first load only)
- Skeleton loaders: Shimmer effect for data tables while loading

**No Animations**: Avoid scroll-triggered effects, parallax, or decorative motion. Keep interface snappy and predictable.

---

This design creates a professional, trustworthy financial application optimized for data entry and analysis while maintaining visual clarity and modern aesthetics.