import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
  pgEnum,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const membershipRoleEnum = pgEnum("membership_role", [
  "owner",
  "admin",
  "accountant",
  "viewer",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "overdue",
  "paid",
  "partial",
  "void",
]);

export const planTierEnum = pgEnum("plan_tier", ["free", "pro", "business"]);

export const gstTypeEnum = pgEnum("gst_type", ["cgst_sgst", "igst"]);

export const stockTxnTypeEnum = pgEnum("stock_txn_type", [
  "purchase",
  "sale",
  "adjustment",
  "grn",
]);

export const creditNoteTypeEnum = pgEnum("credit_note_type", [
  "credit",
  "debit",
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
]);

export const dealStageEnum = pgEnum("deal_stage", [
  "prospecting",
  "qualification",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "call",
  "email",
  "meeting",
  "note",
  "task",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

// Organizations
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  gstin: varchar("gstin", { length: 15 }),
  pan: varchar("pan", { length: 10 }),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: varchar("pincode", { length: 6 }),
  country: text("country").default("India"),
  logoUrl: text("logo_url"),
  bankDetails: jsonb("bank_details").$type<{
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branch?: string;
  }>(),
  fiscalYearStart: integer("fiscal_year_start").default(4), // April = 4
  invoicePrefix: text("invoice_prefix").default("INV"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Memberships (User-Org relationship with roles)
export const memberships = pgTable(
  "memberships",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: membershipRoleEnum("role").notNull().default("viewer"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userOrgUnique: unique().on(table.userId, table.orgId),
    orgIdIdx: index("memberships_org_id_idx").on(table.orgId),
    userIdIdx: index("memberships_user_id_idx").on(table.userId),
  })
);

// Customers
export const customers = pgTable(
  "customers",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    gstin: varchar("gstin", { length: 15 }),
    pan: varchar("pan", { length: 10 }),
    email: text("email"),
    phone: text("phone"),
    billingAddress: text("billing_address"),
    billingCity: text("billing_city"),
    billingState: text("billing_state"),
    billingPincode: varchar("billing_pincode", { length: 6 }),
    shippingAddress: text("shipping_address"),
    shippingCity: text("shipping_city"),
    shippingState: text("shipping_state"),
    shippingPincode: varchar("shipping_pincode", { length: 6 }),
    contactPerson: text("contact_person"),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("customers_org_id_idx").on(table.orgId),
  })
);

// Warehouses
export const warehouses = pgTable(
  "warehouses",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    pincode: varchar("pincode", { length: 6 }),
    isDefault: boolean("is_default").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("warehouses_org_id_idx").on(table.orgId),
  })
);

// Items/Products
export const items = pgTable(
  "items",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    sku: text("sku"),
    hsnCode: varchar("hsn_code", { length: 8 }),
    sacCode: varchar("sac_code", { length: 6 }),
    unit: text("unit").default("PCS"),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("18.00"), // GST rate
    stockQuantity: integer("stock_quantity").default(0),
    lowStockThreshold: integer("low_stock_threshold").default(10),
    defaultWarehouseId: varchar("default_warehouse_id").references(() => warehouses.id),
    isService: boolean("is_service").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("items_org_id_idx").on(table.orgId),
    skuIdx: index("items_sku_idx").on(table.sku),
  })
);

// Stock Transactions
export const stockTransactions = pgTable(
  "stock_transactions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    itemId: varchar("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    warehouseId: varchar("warehouse_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "restrict" }),
    type: stockTxnTypeEnum("type").notNull(),
    quantity: integer("quantity").notNull(),
    referenceId: varchar("reference_id"), // Invoice ID or adjustment ID
    referenceType: text("reference_type"), // "invoice", "adjustment", etc.
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: varchar("created_by").references(() => users.id),
  },
  (table) => ({
    orgIdIdx: index("stock_txns_org_id_idx").on(table.orgId),
    itemIdIdx: index("stock_txns_item_id_idx").on(table.itemId),
    warehouseIdIdx: index("stock_txns_warehouse_id_idx").on(table.warehouseId),
  })
);

// Sequence Counters (for invoice numbering)
export const sequenceCounters = pgTable(
  "sequence_counters",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(), // "invoice", "credit_note", etc.
    fiscalYear: text("fiscal_year").notNull(), // "2024-25"
    currentValue: integer("current_value").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgEntityFyUnique: unique().on(table.orgId, table.entityType, table.fiscalYear),
    orgIdIdx: index("seq_counters_org_id_idx").on(table.orgId),
  })
);

// Invoices
export const invoices = pgTable(
  "invoices",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    invoiceNumber: text("invoice_number").notNull(),
    customerId: varchar("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    invoiceDate: timestamp("invoice_date").notNull(),
    dueDate: timestamp("due_date").notNull(),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    placeOfSupply: text("place_of_supply").notNull(), // State code or name
    isReverseCharge: boolean("is_reverse_charge").default(false),
    isComposition: boolean("is_composition").default(false),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    cgst: decimal("cgst", { precision: 12, scale: 2 }).default("0"),
    sgst: decimal("sgst", { precision: 12, scale: 2 }).default("0"),
    igst: decimal("igst", { precision: 12, scale: 2 }).default("0"),
    tcs: decimal("tcs", { precision: 12, scale: 2 }).default("0"),
    tds: decimal("tds", { precision: 12, scale: 2 }).default("0"),
    roundOff: decimal("round_off", { precision: 12, scale: 2 }).default("0"),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).default("0"),
    amountDue: decimal("amount_due", { precision: 12, scale: 2 }).notNull(),
    notes: text("notes"),
    termsAndConditions: text("terms_and_conditions"),
    pdfUrl: text("pdf_url"),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdBy: varchar("created_by").references(() => users.id),
  },
  (table) => ({
    orgIdIdx: index("invoices_org_id_idx").on(table.orgId),
    customerIdIdx: index("invoices_customer_id_idx").on(table.customerId),
    invoiceNumberUnique: unique().on(table.orgId, table.invoiceNumber),
    statusIdx: index("invoices_status_idx").on(table.status),
  })
);

// Invoice Items
export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    invoiceId: varchar("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    itemId: varchar("item_id").references(() => items.id, { onDelete: "restrict" }),
    description: text("description").notNull(),
    hsnCode: varchar("hsn_code", { length: 8 }),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
    unit: text("unit").default("PCS"),
    rate: decimal("rate", { precision: 12, scale: 2 }).notNull(),
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).notNull(),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  },
  (table) => ({
    orgIdIdx: index("invoice_items_org_id_idx").on(table.orgId),
    invoiceIdIdx: index("invoice_items_invoice_id_idx").on(table.invoiceId),
  })
);

// Payments
export const payments = pgTable(
  "payments",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    invoiceId: varchar("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    paymentDate: timestamp("payment_date").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    paymentMethod: text("payment_method"), // "cash", "bank_transfer", "upi", etc.
    referenceNumber: text("reference_number"),
    notes: text("notes"),
    receiptUrl: text("receipt_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: varchar("created_by").references(() => users.id),
  },
  (table) => ({
    orgIdIdx: index("payments_org_id_idx").on(table.orgId),
    invoiceIdIdx: index("payments_invoice_id_idx").on(table.invoiceId),
  })
);

// Credit/Debit Notes
export const creditNotes = pgTable(
  "credit_notes",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    noteNumber: text("note_number").notNull(),
    type: creditNoteTypeEnum("type").notNull(),
    invoiceId: varchar("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "restrict" }),
    customerId: varchar("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    noteDate: timestamp("note_date").notNull(),
    reason: text("reason"),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    cgst: decimal("cgst", { precision: 12, scale: 2 }).default("0"),
    sgst: decimal("sgst", { precision: 12, scale: 2 }).default("0"),
    igst: decimal("igst", { precision: 12, scale: 2 }).default("0"),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    pdfUrl: text("pdf_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: varchar("created_by").references(() => users.id),
  },
  (table) => ({
    orgIdIdx: index("credit_notes_org_id_idx").on(table.orgId),
    invoiceIdIdx: index("credit_notes_invoice_id_idx").on(table.invoiceId),
    noteNumberUnique: unique().on(table.orgId, table.noteNumber),
  })
);

// Expenses
export const expenses = pgTable(
  "expenses",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    vendorName: text("vendor_name").notNull(),
    vendorGstin: varchar("vendor_gstin", { length: 15 }),
    category: text("category"), // "office_supplies", "utilities", etc.
    description: text("description").notNull(),
    expenseDate: timestamp("expense_date").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    billNumber: text("bill_number"),
    attachmentUrl: text("attachment_url"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: varchar("created_by").references(() => users.id),
  },
  (table) => ({
    orgIdIdx: index("expenses_org_id_idx").on(table.orgId),
    categoryIdx: index("expenses_category_idx").on(table.category),
  })
);

// Plans
export const plans = pgTable("plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  tier: planTierEnum("tier").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("INR"),
  maxInvoicesPerMonth: integer("max_invoices_per_month"),
  maxUsers: integer("max_users"),
  features: jsonb("features").$type<string[]>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subscriptions
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    planId: varchar("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "restrict" }),
    status: text("status").notNull().default("active"), // "active", "cancelled", "expired"
    currentPeriodStart: timestamp("current_period_start").notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),
    invoicesUsedThisMonth: integer("invoices_used_this_month").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("subscriptions_org_id_idx").on(table.orgId),
  })
);

// Refresh Tokens
export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    revokedAt: timestamp("revoked_at"),
  },
  (table) => ({
    userIdIdx: index("refresh_tokens_user_id_idx").on(table.userId),
    tokenHashIdx: index("refresh_tokens_token_hash_idx").on(table.tokenHash),
  })
);

// Audit Logs
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(), // "create", "update", "delete"
    entityType: text("entity_type").notNull(), // "invoice", "customer", etc.
    entityId: varchar("entity_id").notNull(),
    changes: jsonb("changes"), // Before/after diff
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("audit_logs_org_id_idx").on(table.orgId),
    entityIdx: index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  })
);

// CRM - Leads
export const leads = pgTable(
  "leads",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    company: text("company"),
    jobTitle: text("job_title"),
    status: leadStatusEnum("status").notNull().default("new"),
    source: text("source"), // "website", "referral", "cold_call", etc.
    assignedTo: varchar("assigned_to").references(() => users.id),
    estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("leads_org_id_idx").on(table.orgId),
    statusIdx: index("leads_status_idx").on(table.status),
    assignedToIdx: index("leads_assigned_to_idx").on(table.assignedTo),
  })
);

// CRM - Deals/Opportunities
export const deals = pgTable(
  "deals",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }),
    leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
    stage: dealStageEnum("stage").notNull().default("prospecting"),
    value: decimal("value", { precision: 12, scale: 2 }).notNull(),
    probability: integer("probability").default(50), // 0-100%
    expectedCloseDate: timestamp("expected_close_date"),
    closedDate: timestamp("closed_date"),
    assignedTo: varchar("assigned_to").references(() => users.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("deals_org_id_idx").on(table.orgId),
    stageIdx: index("deals_stage_idx").on(table.stage),
    customerIdIdx: index("deals_customer_id_idx").on(table.customerId),
    assignedToIdx: index("deals_assigned_to_idx").on(table.assignedTo),
  })
);

// CRM - Activities
export const activities = pgTable(
  "activities",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: activityTypeEnum("type").notNull(),
    subject: text("subject").notNull(),
    description: text("description"),
    leadId: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }),
    dealId: varchar("deal_id").references(() => deals.id, { onDelete: "cascade" }),
    customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    createdBy: varchar("created_by")
      .notNull()
      .references(() => users.id),
    activityDate: timestamp("activity_date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("activities_org_id_idx").on(table.orgId),
    leadIdIdx: index("activities_lead_id_idx").on(table.leadId),
    dealIdIdx: index("activities_deal_id_idx").on(table.dealId),
    customerIdIdx: index("activities_customer_id_idx").on(table.customerId),
  })
);

// CRM - Tasks
export const tasks = pgTable(
  "tasks",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: taskStatusEnum("status").notNull().default("pending"),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    dueDate: timestamp("due_date"),
    assignedTo: varchar("assigned_to").references(() => users.id),
    leadId: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }),
    dealId: varchar("deal_id").references(() => deals.id, { onDelete: "cascade" }),
    customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    createdBy: varchar("created_by")
      .notNull()
      .references(() => users.id),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("tasks_org_id_idx").on(table.orgId),
    statusIdx: index("tasks_status_idx").on(table.status),
    assignedToIdx: index("tasks_assigned_to_idx").on(table.assignedTo),
    dueDateIdx: index("tasks_due_date_idx").on(table.dueDate),
  })
);

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
  customers: many(customers),
  warehouses: many(warehouses),
  items: many(items),
  invoices: many(invoices),
  creditNotes: many(creditNotes),
  expenses: many(expenses),
  subscriptions: many(subscriptions),
  auditLogs: many(auditLogs),
  leads: many(leads),
  deals: many(deals),
  activities: many(activities),
  tasks: many(tasks),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [memberships.orgId],
    references: [organizations.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.orgId],
    references: [organizations.id],
  }),
  invoices: many(invoices),
  creditNotes: many(creditNotes),
}));

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [warehouses.orgId],
    references: [organizations.id],
  }),
  stockTransactions: many(stockTransactions),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [items.orgId],
    references: [organizations.id],
  }),
  stockTransactions: many(stockTransactions),
  invoiceItems: many(invoiceItems),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [invoices.orgId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
  creditNotes: many(creditNotes),
}));

export const creditNotesRelations = relations(creditNotes, ({ one }) => ({
  organization: one(organizations, {
    fields: [creditNotes.orgId],
    references: [organizations.id],
  }),
  invoice: one(invoices, {
    fields: [creditNotes.invoiceId],
    references: [invoices.id],
  }),
  customer: one(customers, {
    fields: [creditNotes.customerId],
    references: [customers.id],
  }),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  item: one(items, {
    fields: [invoiceItems.itemId],
    references: [items.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  organization: one(organizations, {
    fields: [payments.orgId],
    references: [organizations.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  organization: one(organizations, {
    fields: [expenses.orgId],
    references: [organizations.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [subscriptions.orgId],
    references: [organizations.id],
  }),
  plan: one(plans, {
    fields: [subscriptions.planId],
    references: [plans.id],
  }),
}));

// Insert Schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMembershipSchema = createInsertSchema(memberships).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWarehouseSchema = createInsertSchema(warehouses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  stockQuantity: true,
}).extend({
  defaultWarehouseId: z.string().optional().transform(val => val === "" ? undefined : val),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  pdfUrl: true,
  sentAt: true,
}).extend({
  cgst: z.string().optional().default("0"),
  sgst: z.string().optional().default("0"),
  igst: z.string().optional().default("0"),
  tcs: z.string().optional().default("0"),
  tds: z.string().optional().default("0"),
  roundOff: z.string().optional().default("0"),
  amountPaid: z.string().optional().default("0"),
  isReverseCharge: z.boolean().optional().default(false),
  isComposition: z.boolean().optional().default(false),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  createdBy: z.string().optional(),
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertCreditNoteSchema = createInsertSchema(creditNotes).omit({
  id: true,
  createdAt: true,
  pdfUrl: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
});

export const insertStockTransactionSchema = createInsertSchema(stockTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

// Select Types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;

export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type CreditNote = typeof creditNotes.$inferSelect;
export type InsertCreditNote = z.infer<typeof insertCreditNoteSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type StockTransaction = typeof stockTransactions.$inferSelect;
export type InsertStockTransaction = z.infer<typeof insertStockTransactionSchema>;

export type RefreshToken = typeof refreshTokens.$inferSelect;

export type Plan = typeof plans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type SequenceCounter = typeof sequenceCounters.$inferSelect;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
