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

export const purchaseStatusEnum = pgEnum("purchase_status", [
  "draft",
  "sent",
  "confirmed",
  "partially_received",
  "received",
  "cancelled",
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

export const accountTypeEnum = pgEnum("account_type", [
  "asset",
  "liability",
  "revenue",
  "expense",
  "equity",
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
  "open",
  "pending",
  "resolved",
  "closed",
]);

export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "low",
  "normal",
  "high",
  "urgent",
]);

export const journalTypeEnum = pgEnum("journal_type", [
  "invoice",
  "payment",
  "manual",
  "adjustment",
]);

export const recurrenceFrequencyEnum = pgEnum("recurrence_frequency", [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
]);

export const gstinTypeEnum = pgEnum("gstin_type", [
  "regular",
  "composition",
  "sez",
  "export",
]);

export const financialYearStatusEnum = pgEnum("financial_year_status", [
  "active",
  "closed",
  "locked",
]);

export const userRoleEnum = pgEnum("user_role", [
  "platform_admin",
  "org_admin",
  "staff",
  "viewer",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "expired",
]);

export const organizationStatusEnum = pgEnum("organization_status", [
  "active",
  "disabled",
  "deleted",
]);

export const planEnum = pgEnum("plan", [
  "free",
  "basic",
  "pro",
  "enterprise",
]);

export const billingCycleEnum = pgEnum("billing_cycle", [
  "monthly",
  "quarterly",
  "annually",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "razorpay",
  "stripe",
  "payumoney",
  "paytm",
  "ccavenue",
  "manual",
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
  trialStartedAt: timestamp("trial_started_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("trialing"),
  planId: planEnum("plan_id").default("free"),
  status: organizationStatusEnum("status").default("active").notNull(),
  isActive: boolean("is_active").default(true),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Organization GSTINs (Multi-GSTIN support)
export const orgGstins = pgTable(
  "org_gstins",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    gstin: varchar("gstin", { length: 15 }).notNull(),
    type: gstinTypeEnum("type").notNull().default("regular"),
    legalName: text("legal_name").notNull(),
    tradeName: text("trade_name"),
    stateCode: varchar("state_code", { length: 2 }).notNull(), // "27" for Maharashtra
    stateName: text("state_name").notNull(),
    address: text("address").notNull(),
    pincode: varchar("pincode", { length: 6 }).notNull(),
    panNumber: varchar("pan_number", { length: 10 }),
    isActive: boolean("is_active").default(true),
    isDefault: boolean("is_default").default(false), // Default GSTIN for invoicing
    registrationDate: timestamp("registration_date"),
    validFrom: timestamp("valid_from"),
    validTo: timestamp("valid_to"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("org_gstins_org_id_idx").on(table.orgId),
    gstinUnique: unique("org_gstins_gstin_unique").on(table.gstin),
  })
);

// Financial Years
export const financialYears = pgTable(
  "financial_years",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // "2024-25"
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    status: financialYearStatusEnum("status").notNull().default("active"),
    isCurrent: boolean("is_current").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("financial_years_org_id_idx").on(table.orgId),
    orgNameUnique: unique("financial_years_org_name_unique").on(table.orgId, table.name),
  })
);

// Units Master
export const units = pgTable(
  "units",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // "Pieces", "Kilograms", "Meters"
    symbol: varchar("symbol", { length: 10 }).notNull(), // "PCS", "KG", "M"
    uqc: varchar("uqc", { length: 3 }), // Unit Quantity Code for e-invoicing
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("units_org_id_idx").on(table.orgId),
    orgSymbolUnique: unique("units_org_symbol_unique").on(table.orgId, table.symbol),
  })
);

// GST Rates Master
export const gstRates = pgTable(
  "gst_rates",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // "GST 18%", "GST 5% + Cess 1%"
    rate: decimal("rate", { precision: 5, scale: 2 }).notNull(), // 18.00, 5.00, 28.00
    cess: decimal("cess", { precision: 5, scale: 2 }).default("0"), // Additional cess percentage
    cessAmount: decimal("cess_amount", { precision: 10, scale: 2 }).default("0"), // Fixed cess amount per unit
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("gst_rates_org_id_idx").on(table.orgId),
  })
);

// Price Lists
export const priceLists = pgTable(
  "price_lists",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // "Retail", "Wholesale", "Distributor"
    description: text("description"),
    isDefault: boolean("is_default").default(false),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("price_lists_org_id_idx").on(table.orgId),
  })
);

// Users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").default("viewer"),
  isSuperAdmin: boolean("is_super_admin").default(false), // Deprecated, use role instead
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscription Plans (Platform-wide plans managed by admin)
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Starter", "Professional", "Enterprise"
  description: text("description"),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  quarterlyPrice: decimal("quarterly_price", { precision: 10, scale: 2 }),
  annualPrice: decimal("annual_price", { precision: 10, scale: 2 }),
  currency: text("currency").default("INR"),
  features: jsonb("features").$type<string[]>(), // Array of feature descriptions
  limits: jsonb("limits").$type<{
    maxUsers?: number;
    maxInvoicesPerMonth?: number;
    maxCustomers?: number;
    maxWarehouses?: number;
    storageGB?: number;
  }>(),
  isActive: boolean("is_active").default(true),
  isPopular: boolean("is_popular").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payment Transactions
export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").references(() => subscriptionPlans.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("INR"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentGatewayId: text("payment_gateway_id"), // Razorpay/Stripe transaction ID
  paymentGatewayResponse: jsonb("payment_gateway_response"),
  billingCycle: billingCycleEnum("billing_cycle"),
  notes: text("notes"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("payment_transactions_org_id_idx").on(table.orgId),
}));

// Platform Settings (for admin configuration)
export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: jsonb("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payment Gateway Configurations (per organization)
export const paymentGatewayConfigs = pgTable(
  "payment_gateway_configs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    gatewayName: text("gateway_name").notNull(), // razorpay, stripe, payumoney, paytm, ccavenue
    displayName: text("display_name").notNull(),
    isActive: boolean("is_active").default(false),
    isDefault: boolean("is_default").default(false),
    mode: text("mode").notNull().default("test"), // test or live
    config: jsonb("config").$type<{
      // For Razorpay
      keyId?: string;
      keySecret?: string;
      // For Stripe
      publishableKey?: string;
      secretKey?: string;
      // For PayUMoney
      merchantKey?: string;
      merchantSalt?: string;
      // For Paytm
      merchantId?: string;
      merchantKey2?: string;
      // For CCAvenue
      merchantId2?: string;
      accessCode?: string;
      workingKey?: string;
      // Common fields
      webhookSecret?: string;
      callbackUrl?: string;
      [key: string]: any;
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("payment_gateway_configs_org_id_idx").on(table.orgId),
    orgGatewayUnique: unique("payment_gateway_configs_org_gateway_unique").on(table.orgId, table.gatewayName),
  })
);

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
    placeOfSupply: varchar("place_of_supply", { length: 2 }), // State code for GST
    billingAddress: text("billing_address"),
    billingCity: text("billing_city"),
    billingState: text("billing_state"),
    billingPincode: varchar("billing_pincode", { length: 6 }),
    billingCountry: text("billing_country").default("India"),
    shippingAddress: text("shipping_address"),
    shippingCity: text("shipping_city"),
    shippingState: text("shipping_state"),
    shippingPincode: varchar("shipping_pincode", { length: 6 }),
    shippingCountry: text("shipping_country").default("India"),
    contactPerson: text("contact_person"),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    priceListId: varchar("price_list_id").references(() => priceLists.id),
    creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }),
    creditDays: integer("credit_days").default(30),
    openingBalance: decimal("opening_balance", { precision: 12, scale: 2 }).default("0"),
    notes: text("notes"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("customers_org_id_idx").on(table.orgId),
    gstinIdx: index("customers_gstin_idx").on(table.gstin),
  })
);

// Vendors/Suppliers
export const vendors = pgTable(
  "vendors",
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
    placeOfSupply: varchar("place_of_supply", { length: 2 }), // State code for GST
    billingAddress: text("billing_address"),
    billingCity: text("billing_city"),
    billingState: text("billing_state"),
    billingPincode: varchar("billing_pincode", { length: 6 }),
    billingCountry: text("billing_country").default("India"),
    contactPerson: text("contact_person"),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    tdsSection: varchar("tds_section", { length: 10 }), // "194C", "194J", etc.
    tdsRate: decimal("tds_rate", { precision: 5, scale: 2 }),
    paymentTerms: text("payment_terms"),
    openingBalance: decimal("opening_balance", { precision: 12, scale: 2 }).default("0"),
    notes: text("notes"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("vendors_org_id_idx").on(table.orgId),
    gstinIdx: index("vendors_gstin_idx").on(table.gstin),
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
    barcode: varchar("barcode", { length: 50 }),
    hsnCode: varchar("hsn_code", { length: 8 }),
    sacCode: varchar("sac_code", { length: 6 }),
    unitId: varchar("unit_id").references(() => units.id),
    unit: text("unit").default("PCS"), // Legacy field, use unitId
    gstRateId: varchar("gst_rate_id").references(() => gstRates.id),
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("18.00"), // Legacy, use gstRateId
    cess: decimal("cess", { precision: 5, scale: 2 }).default("0"), // Cess percentage
    cessAmount: decimal("cess_amount", { precision: 10, scale: 2 }).default("0"), // Fixed cess per unit
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    priceListId: varchar("price_list_id").references(() => priceLists.id),
    purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }),
    stockQuantity: integer("stock_quantity").default(0),
    lowStockThreshold: integer("low_stock_threshold").default(10),
    defaultWarehouseId: varchar("default_warehouse_id").references(() => warehouses.id),
    isService: boolean("is_service").default(false),
    isBatchTracked: boolean("is_batch_tracked").default(false),
    isSerialTracked: boolean("is_serial_tracked").default(false),
    openingStock: integer("opening_stock").default(0),
    openingStockValue: decimal("opening_stock_value", { precision: 12, scale: 2 }).default("0"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("items_org_id_idx").on(table.orgId),
    skuIdx: index("items_sku_idx").on(table.sku),
    barcodeIdx: index("items_barcode_idx").on(table.barcode),
  })
);

// Item Price List entries (for customer-specific pricing)
export const itemPrices = pgTable(
  "item_prices",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    itemId: varchar("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    priceListId: varchar("price_list_id")
      .notNull()
      .references(() => priceLists.id, { onDelete: "cascade" }),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    effectiveFrom: timestamp("effective_from"),
    effectiveTo: timestamp("effective_to"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("item_prices_org_id_idx").on(table.orgId),
    itemIdIdx: index("item_prices_item_id_idx").on(table.itemId),
    priceListIdIdx: index("item_prices_price_list_id_idx").on(table.priceListId),
    uniquePriceEntry: unique("item_prices_unique").on(table.itemId, table.priceListId),
  })
);

// Item Batches (for batch-tracked items)
export const itemBatches = pgTable(
  "item_batches",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    itemId: varchar("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    batchNumber: text("batch_number").notNull(),
    quantity: integer("quantity").notNull(),
    manufacturingDate: timestamp("manufacturing_date"),
    expiryDate: timestamp("expiryDate"),
    purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }),
    sellingPrice: decimal("selling_price", { precision: 12, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("item_batches_org_id_idx").on(table.orgId),
    itemIdIdx: index("item_batches_item_id_idx").on(table.itemId),
    batchNumberIdx: index("item_batches_batch_number_idx").on(table.batchNumber),
  })
);

// Item Serials (for serial-tracked items)
export const itemSerials = pgTable(
  "item_serials",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    itemId: varchar("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    serialNumber: text("serial_number").notNull(),
    batchId: varchar("batch_id").references(() => itemBatches.id),
    status: text("status").default("available"), // available, sold, damaged
    warrantyExpiryDate: timestamp("warranty_expiry_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("item_serials_org_id_idx").on(table.orgId),
    itemIdIdx: index("item_serials_item_id_idx").on(table.itemId),
    serialNumberUnique: unique("item_serials_serial_unique").on(table.orgId, table.serialNumber),
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
    prefix: text("prefix").default("INV").notNull(), // Invoice prefix
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

// Purchase Orders
export const purchaseOrders = pgTable(
  "purchase_orders",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    poNumber: text("po_number").notNull(),
    vendorId: varchar("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "restrict" }),
    orderDate: timestamp("order_date").notNull(),
    expectedDeliveryDate: timestamp("expected_delivery_date"),
    status: purchaseStatusEnum("status").notNull().default("draft"),
    placeOfSupply: text("place_of_supply").notNull(), // State code or name
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    cgst: decimal("cgst", { precision: 12, scale: 2 }).default("0"),
    sgst: decimal("sgst", { precision: 12, scale: 2 }).default("0"),
    igst: decimal("igst", { precision: 12, scale: 2 }).default("0"),
    tdsAmount: decimal("tds_amount", { precision: 12, scale: 2 }).default("0"),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    termsAndConditions: text("terms_and_conditions"),
    notes: text("notes"),
    createdBy: varchar("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("purchase_orders_org_id_idx").on(table.orgId),
    vendorIdIdx: index("purchase_orders_vendor_id_idx").on(table.vendorId),
    poNumberUnique: unique().on(table.orgId, table.poNumber),
    statusIdx: index("purchase_orders_status_idx").on(table.status),
  })
);

// Purchase Order Items
export const purchaseOrderItems = pgTable(
  "purchase_order_items",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    purchaseOrderId: varchar("purchase_order_id")
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: "cascade" }),
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
    orgIdIdx: index("purchase_order_items_org_id_idx").on(table.orgId),
    poIdIdx: index("purchase_order_items_po_id_idx").on(table.purchaseOrderId),
  })
);

// Purchase Invoices
export const purchaseInvoices = pgTable(
  "purchase_invoices",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    invoiceNumber: text("invoice_number").notNull(), // Vendor's invoice number
    vendorId: varchar("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "restrict" }),
    purchaseOrderId: varchar("purchase_order_id").references(() => purchaseOrders.id, { onDelete: "set null" }),
    invoiceDate: timestamp("invoice_date").notNull(),
    dueDate: timestamp("due_date").notNull(),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    placeOfSupply: text("place_of_supply").notNull(),
    isReverseCharge: boolean("is_reverse_charge").default(false),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    cgst: decimal("cgst", { precision: 12, scale: 2 }).default("0"),
    sgst: decimal("sgst", { precision: 12, scale: 2 }).default("0"),
    igst: decimal("igst", { precision: 12, scale: 2 }).default("0"),
    tdsAmount: decimal("tds_amount", { precision: 12, scale: 2 }).default("0"),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    amountDue: decimal("amount_due", { precision: 12, scale: 2 }).notNull(),
    notes: text("notes"),
    pdfUrl: text("pdf_url"),
    createdBy: varchar("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("purchase_invoices_org_id_idx").on(table.orgId),
    vendorIdIdx: index("purchase_invoices_vendor_id_idx").on(table.vendorId),
    invoiceNumberIdx: unique().on(table.orgId, table.invoiceNumber),
    statusIdx: index("purchase_invoices_status_idx").on(table.status),
  })
);

// Purchase Invoice Items
export const purchaseInvoiceItems = pgTable(
  "purchase_invoice_items",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    purchaseInvoiceId: varchar("purchase_invoice_id")
      .notNull()
      .references(() => purchaseInvoices.id, { onDelete: "cascade" }),
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
    orgIdIdx: index("purchase_invoice_items_org_id_idx").on(table.orgId),
    invoiceIdIdx: index("purchase_invoice_items_invoice_id_idx").on(table.purchaseInvoiceId),
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

// Audit Logs (supports both org-level and platform admin actions)
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id").references(() => organizations.id, { onDelete: "cascade" }), // null for platform admin actions
    userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(), // "create", "update", "delete", "delete_organization", etc.
    entityType: text("entity_type").notNull(), // "invoice", "customer", "organization", etc.
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

// CRM - Accounts (Company accounts)
export const accounts = pgTable(
  "accounts",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    industry: text("industry"),
    website: text("website"),
    phone: text("phone"),
    email: text("email"),
    billingAddress: text("billing_address"),
    billingCity: text("billing_city"),
    billingState: text("billing_state"),
    billingPincode: varchar("billing_pincode", { length: 6 }),
    gstin: varchar("gstin", { length: 15 }),
    pan: varchar("pan", { length: 10 }),
    parentAccountId: varchar("parent_account_id"),
    ownerId: varchar("owner_id").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("accounts_org_id_idx").on(table.orgId),
    ownerIdIdx: index("accounts_owner_id_idx").on(table.ownerId),
  })
);

// CRM - Contacts (Individual contacts)
export const contacts = pgTable(
  "contacts",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    accountId: varchar("account_id").references(() => accounts.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    email: text("email"),
    phone: text("phone"),
    mobile: text("mobile"),
    title: text("title"),
    department: text("department"),
    isPrimary: boolean("is_primary").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("contacts_org_id_idx").on(table.orgId),
    accountIdIdx: index("contacts_account_id_idx").on(table.accountId),
    emailIdx: index("contacts_email_idx").on(table.email),
  })
);

// CRM - Deal Stages (Custom pipeline stages)
export const dealStages = pgTable(
  "deal_stages",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    probability: integer("probability").default(0),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("deal_stages_org_id_idx").on(table.orgId),
    orderIdx: index("deal_stages_order_idx").on(table.displayOrder),
  })
);

// Accounting - Chart of Accounts
export const chartOfAccounts = pgTable(
  "chart_of_accounts",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    type: accountTypeEnum("type").notNull(),
    parentAccountId: varchar("parent_account_id"),
    isActive: boolean("is_active").default(true),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("coa_org_id_idx").on(table.orgId),
    codeIdx: index("coa_code_idx").on(table.code),
    typeIdx: index("coa_type_idx").on(table.type),
    orgCodeUnique: unique().on(table.orgId, table.code),
  })
);

// Accounting - Journals (Journal entry headers)
export const journals = pgTable(
  "journals",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    journalNumber: text("journal_number").notNull(),
    journalDate: timestamp("journal_date").notNull(),
    type: journalTypeEnum("type").notNull(),
    referenceId: varchar("reference_id"),
    description: text("description"),
    createdBy: varchar("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("journals_org_id_idx").on(table.orgId),
    typeIdx: index("journals_type_idx").on(table.type),
    dateIdx: index("journals_date_idx").on(table.journalDate),
    orgNumberUnique: unique().on(table.orgId, table.journalNumber),
  })
);

// Accounting - Journal Entries (Journal entry lines)
export const journalEntries = pgTable(
  "journal_entries",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    journalId: varchar("journal_id")
      .notNull()
      .references(() => journals.id, { onDelete: "cascade" }),
    accountId: varchar("account_id")
      .notNull()
      .references(() => chartOfAccounts.id, { onDelete: "restrict" }),
    debit: decimal("debit", { precision: 12, scale: 2 }).default("0"),
    credit: decimal("credit", { precision: 12, scale: 2 }).default("0"),
    description: text("description"),
  },
  (table) => ({
    journalIdIdx: index("journal_entries_journal_id_idx").on(table.journalId),
    accountIdIdx: index("journal_entries_account_id_idx").on(table.accountId),
  })
);

// Support - Tickets
export const tickets = pgTable(
  "tickets",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    ticketNumber: text("ticket_number").notNull(),
    subject: text("subject").notNull(),
    description: text("description"),
    status: ticketStatusEnum("status").notNull().default("open"),
    priority: ticketPriorityEnum("priority").notNull().default("normal"),
    customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }),
    contactId: varchar("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    assignedTo: varchar("assigned_to").references(() => users.id, { onDelete: "set null" }),
    createdBy: varchar("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("tickets_org_id_idx").on(table.orgId),
    statusIdx: index("tickets_status_idx").on(table.status),
    assignedToIdx: index("tickets_assigned_to_idx").on(table.assignedTo),
    orgNumberUnique: unique().on(table.orgId, table.ticketNumber),
  })
);

// Support - Ticket Comments
export const ticketComments = pgTable(
  "ticket_comments",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    ticketId: varchar("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    isInternal: boolean("is_internal").default(false),
    createdBy: varchar("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    ticketIdIdx: index("ticket_comments_ticket_id_idx").on(table.ticketId),
  })
);

// Shared - Attachments
export const attachments = pgTable(
  "attachments",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size"),
    mimeType: text("mime_type"),
    url: text("url").notNull(),
    entityType: text("entity_type"),
    entityId: varchar("entity_id"),
    uploadedBy: varchar("uploaded_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("attachments_org_id_idx").on(table.orgId),
    entityIdx: index("attachments_entity_idx").on(table.entityType, table.entityId),
  })
);

// Shared - Notes
export const notes = pgTable(
  "notes",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    entityType: text("entity_type"),
    entityId: varchar("entity_id"),
    createdBy: varchar("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("notes_org_id_idx").on(table.orgId),
    entityIdx: index("notes_entity_idx").on(table.entityType, table.entityId),
  })
);

// Shared - Teams
export const teams = pgTable(
  "teams",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    leaderId: varchar("leader_id").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("teams_org_id_idx").on(table.orgId),
  })
);

// Shared - Team Members
export const teamMembers = pgTable(
  "team_members",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    teamId: varchar("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    teamIdIdx: index("team_members_team_id_idx").on(table.teamId),
    userIdIdx: index("team_members_user_id_idx").on(table.userId),
    teamUserUnique: unique().on(table.teamId, table.userId),
  })
);

// Billing - Recurring Invoices
export const recurringInvoices = pgTable(
  "recurring_invoices",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: varchar("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: varchar("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    templateName: text("template_name").notNull(),
    frequency: recurrenceFrequencyEnum("frequency").notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),
    nextInvoiceDate: timestamp("next_invoice_date"),
    isActive: boolean("is_active").default(true),
    placeOfSupply: text("place_of_supply").notNull(),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    notes: text("notes"),
    termsAndConditions: text("terms_and_conditions"),
    createdBy: varchar("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("recurring_invoices_org_id_idx").on(table.orgId),
    customerIdIdx: index("recurring_invoices_customer_id_idx").on(table.customerId),
    activeIdx: index("recurring_invoices_active_idx").on(table.isActive),
  })
);

// Billing - Recurring Invoice Items
export const recurringInvoiceItems = pgTable(
  "recurring_invoice_items",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    recurringInvoiceId: varchar("recurring_invoice_id")
      .notNull()
      .references(() => recurringInvoices.id, { onDelete: "cascade" }),
    itemId: varchar("item_id").references(() => items.id, { onDelete: "restrict" }),
    description: text("description").notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
    rate: decimal("rate", { precision: 12, scale: 2 }).notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  },
  (table) => ({
    recurringInvoiceIdIdx: index("recurring_invoice_items_recurring_id_idx").on(table.recurringInvoiceId),
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

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlatformSettingSchema = createInsertSchema(platformSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertPaymentGatewayConfigSchema = createInsertSchema(paymentGatewayConfigs).omit({
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

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrgGstinSchema = createInsertSchema(orgGstins).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFinancialYearSchema = createInsertSchema(financialYears).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().transform(val => new Date(val)),
});

export const insertUnitSchema = createInsertSchema(units).omit({
  id: true,
  createdAt: true,
});

export const insertGstRateSchema = createInsertSchema(gstRates).omit({
  id: true,
  createdAt: true,
});

export const insertPriceListSchema = createInsertSchema(priceLists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertItemPriceSchema = createInsertSchema(itemPrices).omit({
  id: true,
  createdAt: true,
});

export const insertItemBatchSchema = createInsertSchema(itemBatches).omit({
  id: true,
  createdAt: true,
});

export const insertItemSerialSchema = createInsertSchema(itemSerials).omit({
  id: true,
  createdAt: true,
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
}).extend({
  defaultWarehouseId: z.string().optional().transform(val => val === "" ? undefined : val),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  pdfUrl: true,
  sentAt: true,
  invoiceDate: true,
  dueDate: true,
  invoiceNumber: true,
}).extend({
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().transform(val => new Date(val)),
  dueDate: z.string().transform(val => new Date(val)),
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

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDealStageSchema = createInsertSchema(dealStages).omit({
  id: true,
  createdAt: true,
});

export const insertChartOfAccountsSchema = createInsertSchema(chartOfAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJournalSchema = createInsertSchema(journals).omit({
  id: true,
  createdAt: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketCommentSchema = createInsertSchema(ticketComments).omit({
  id: true,
  createdAt: true,
});

export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  createdAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
});

export const insertRecurringInvoiceSchema = createInsertSchema(recurringInvoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecurringInvoiceItemSchema = createInsertSchema(recurringInvoiceItems).omit({
  id: true,
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({
  id: true,
});

export const insertPurchaseInvoiceSchema = createInsertSchema(purchaseInvoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  pdfUrl: true,
});

export const insertPurchaseInvoiceItemSchema = createInsertSchema(purchaseInvoiceItems).omit({
  id: true,
});

// Select Types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type InsertPlatformSetting = z.infer<typeof insertPlatformSettingSchema>;

export type PaymentGatewayConfig = typeof paymentGatewayConfigs.$inferSelect;
export type InsertPaymentGatewayConfig = z.infer<typeof insertPaymentGatewayConfigSchema>;

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

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type DealStage = typeof dealStages.$inferSelect;
export type InsertDealStage = z.infer<typeof insertDealStageSchema>;

export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type InsertChartOfAccount = z.infer<typeof insertChartOfAccountsSchema>;

export type Journal = typeof journals.$inferSelect;
export type InsertJournal = z.infer<typeof insertJournalSchema>;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type TicketComment = typeof ticketComments.$inferSelect;
export type InsertTicketComment = z.infer<typeof insertTicketCommentSchema>;

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type RecurringInvoice = typeof recurringInvoices.$inferSelect;
export type InsertRecurringInvoice = z.infer<typeof insertRecurringInvoiceSchema>;

export type RecurringInvoiceItem = typeof recurringInvoiceItems.$inferSelect;
export type InsertRecurringInvoiceItem = z.infer<typeof insertRecurringInvoiceItemSchema>;

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export type OrgGstin = typeof orgGstins.$inferSelect;
export type InsertOrgGstin = z.infer<typeof insertOrgGstinSchema>;

export type FinancialYear = typeof financialYears.$inferSelect;
export type InsertFinancialYear = z.infer<typeof insertFinancialYearSchema>;

export type Unit = typeof units.$inferSelect;
export type InsertUnit = z.infer<typeof insertUnitSchema>;

export type GstRate = typeof gstRates.$inferSelect;
export type InsertGstRate = z.infer<typeof insertGstRateSchema>;

export type PriceList = typeof priceLists.$inferSelect;
export type InsertPriceList = z.infer<typeof insertPriceListSchema>;

export type ItemPrice = typeof itemPrices.$inferSelect;
export type InsertItemPrice = z.infer<typeof insertItemPriceSchema>;

export type ItemBatch = typeof itemBatches.$inferSelect;
export type InsertItemBatch = z.infer<typeof insertItemBatchSchema>;

export type ItemSerial = typeof itemSerials.$inferSelect;
export type InsertItemSerial = z.infer<typeof insertItemSerialSchema>;

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;

export type PurchaseInvoice = typeof purchaseInvoices.$inferSelect;
export type InsertPurchaseInvoice = z.infer<typeof insertPurchaseInvoiceSchema>;

export type PurchaseInvoiceItem = typeof purchaseInvoiceItems.$inferSelect;
export type InsertPurchaseInvoiceItem = z.infer<typeof insertPurchaseInvoiceItemSchema>;
