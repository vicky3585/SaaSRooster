import {
  type User,
  type InsertUser,
  type Organization,
  type InsertOrganization,
  type Membership,
  type InsertMembership,
  type Customer,
  type InsertCustomer,
  type Warehouse,
  type InsertWarehouse,
  type Item,
  type InsertItem,
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
  type Payment,
  type InsertPayment,
  type CreditNote,
  type InsertCreditNote,
  type Expense,
  type InsertExpense,
  type StockTransaction,
  type InsertStockTransaction,
  type RefreshToken,
  users,
  organizations,
  memberships,
  customers,
  warehouses,
  items,
  invoices,
  invoiceItems,
  payments,
  creditNotes,
  expenses,
  stockTransactions,
  sequenceCounters,
  refreshTokens,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, lt } from "drizzle-orm";
import crypto from "crypto";

export interface IStorage {
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | null>;

  getOrganizationById(id: string): Promise<Organization | null>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<InsertOrganization>): Promise<Organization | null>;
  
  getMembershipByUserAndOrg(userId: string, orgId: string): Promise<Membership | null>;
  getMembershipsByUserId(userId: string): Promise<Membership[]>;
  createMembership(membership: InsertMembership): Promise<Membership>;
  updateMembershipRole(id: string, role: string): Promise<Membership | null>;
  
  getCustomersByOrg(orgId: string): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | null>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | null>;
  deleteCustomer(id: string): Promise<boolean>;
  
  getWarehousesByOrg(orgId: string): Promise<Warehouse[]>;
  getWarehouseById(id: string): Promise<Warehouse | null>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: string, updates: Partial<InsertWarehouse>): Promise<Warehouse | null>;
  
  getItemsByOrg(orgId: string): Promise<Item[]>;
  getItemById(id: string): Promise<Item | null>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: string, updates: Partial<InsertItem>): Promise<Item | null>;
  
  getInvoicesByOrg(orgId: string): Promise<Invoice[]>;
  getInvoiceById(id: string): Promise<Invoice | null>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | null>;
  
  getInvoiceItemsByInvoice(invoiceId: string): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  deleteInvoiceItemsByInvoice(invoiceId: string): Promise<void>;
  
  getPaymentsByInvoice(invoiceId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  getCreditNotesByOrg(orgId: string): Promise<CreditNote[]>;
  createCreditNote(creditNote: InsertCreditNote): Promise<CreditNote>;
  
  getExpensesByOrg(orgId: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  
  createStockTransaction(txn: InsertStockTransaction): Promise<StockTransaction>;
  
  getNextInvoiceNumber(orgId: string, fiscalYear: string): Promise<number>;
  
  storeRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken>;
  getRefreshToken(tokenHash: string): Promise<RefreshToken | null>;
  revokeRefreshToken(tokenHash: string): Promise<void>;
  revokeAllUserRefreshTokens(userId: string): Promise<void>;
  cleanExpiredRefreshTokens(): Promise<void>;
}

export class DbStorage implements IStorage {
  async getUserById(id: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | null> {
    const result = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0] || null;
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
    return result[0] || null;
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const result = await db.insert(organizations).values([org]).returning();
    return result[0];
  }

  async updateOrganization(id: string, updates: Partial<InsertOrganization>): Promise<Organization | null> {
    const cleanUpdates: any = { ...updates, updatedAt: new Date() };
    const result = await db
      .update(organizations)
      .set(cleanUpdates)
      .where(eq(organizations.id, id))
      .returning();
    return result[0] || null;
  }

  async getMembershipByUserAndOrg(userId: string, orgId: string): Promise<Membership | null> {
    const result = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, userId), eq(memberships.orgId, orgId)))
      .limit(1);
    return result[0] || null;
  }

  async getMembershipsByUserId(userId: string): Promise<Membership[]> {
    return await db.select().from(memberships).where(eq(memberships.userId, userId));
  }

  async createMembership(membership: InsertMembership): Promise<Membership> {
    const result = await db.insert(memberships).values(membership).returning();
    return result[0];
  }

  async updateMembershipRole(id: string, role: "owner" | "admin" | "accountant" | "viewer"): Promise<Membership | null> {
    const result = await db
      .update(memberships)
      .set({ role })
      .where(eq(memberships.id, id))
      .returning();
    return result[0] || null;
  }

  async getCustomersByOrg(orgId: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.orgId, orgId));
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return result[0] || null;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const result = await db.insert(customers).values(customer).returning();
    return result[0];
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | null> {
    const result = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id)).returning();
    return result.length > 0;
  }

  async getWarehousesByOrg(orgId: string): Promise<Warehouse[]> {
    return await db.select().from(warehouses).where(eq(warehouses.orgId, orgId));
  }

  async getWarehouseById(id: string): Promise<Warehouse | null> {
    const result = await db.select().from(warehouses).where(eq(warehouses.id, id)).limit(1);
    return result[0] || null;
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const result = await db.insert(warehouses).values(warehouse).returning();
    return result[0];
  }

  async updateWarehouse(id: string, updates: Partial<InsertWarehouse>): Promise<Warehouse | null> {
    const result = await db
      .update(warehouses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(warehouses.id, id))
      .returning();
    return result[0] || null;
  }

  async getItemsByOrg(orgId: string): Promise<Item[]> {
    return await db.select().from(items).where(eq(items.orgId, orgId));
  }

  async getItemById(id: string): Promise<Item | null> {
    const result = await db.select().from(items).where(eq(items.id, id)).limit(1);
    return result[0] || null;
  }

  async createItem(item: InsertItem): Promise<Item> {
    const result = await db.insert(items).values(item).returning();
    return result[0];
  }

  async updateItem(id: string, updates: Partial<InsertItem>): Promise<Item | null> {
    const result = await db
      .update(items)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(items.id, id))
      .returning();
    return result[0] || null;
  }

  async getInvoicesByOrg(orgId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.orgId, orgId));
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return result[0] || null;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(invoices).values(invoice).returning();
    return result[0];
  }

  async updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | null> {
    const result = await db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return result[0] || null;
  }

  async getInvoiceItemsByInvoice(invoiceId: string): Promise<InvoiceItem[]> {
    return await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const result = await db.insert(invoiceItems).values(item).returning();
    return result[0];
  }

  async deleteInvoiceItemsByInvoice(invoiceId: string): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(payment).returning();
    return result[0];
  }

  async getCreditNotesByOrg(orgId: string): Promise<CreditNote[]> {
    return await db.select().from(creditNotes).where(eq(creditNotes.orgId, orgId));
  }

  async createCreditNote(creditNote: InsertCreditNote): Promise<CreditNote> {
    const result = await db.insert(creditNotes).values(creditNote).returning();
    return result[0];
  }

  async getExpensesByOrg(orgId: string): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.orgId, orgId));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const result = await db.insert(expenses).values(expense).returning();
    return result[0];
  }

  async createStockTransaction(txn: InsertStockTransaction): Promise<StockTransaction> {
    const result = await db.insert(stockTransactions).values(txn).returning();
    return result[0];
  }

  async getNextInvoiceNumber(orgId: string, fiscalYear: string): Promise<number> {
    const result = await db
      .select()
      .from(sequenceCounters)
      .where(and(
        eq(sequenceCounters.orgId, orgId),
        eq(sequenceCounters.entityType, "invoice"),
        eq(sequenceCounters.fiscalYear, fiscalYear)
      ))
      .limit(1);

    if (result.length === 0) {
      const newCounter = await db
        .insert(sequenceCounters)
        .values({
          orgId,
          entityType: "invoice",
          fiscalYear,
          currentValue: 1,
        })
        .returning();
      return 1;
    }

    const updated = await db
      .update(sequenceCounters)
      .set({ currentValue: sql`${sequenceCounters.currentValue} + 1` })
      .where(and(
        eq(sequenceCounters.orgId, orgId),
        eq(sequenceCounters.entityType, "invoice"),
        eq(sequenceCounters.fiscalYear, fiscalYear)
      ))
      .returning();

    return updated[0].currentValue;
  }

  async storeRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken> {
    const result = await db
      .insert(refreshTokens)
      .values({
        userId,
        tokenHash,
        expiresAt,
      })
      .returning();
    return result[0];
  }

  async getRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    const result = await db
      .select()
      .from(refreshTokens)
      .where(and(eq(refreshTokens.tokenHash, tokenHash), eq(refreshTokens.revokedAt, sql`NULL`)))
      .limit(1);
    return result[0] || null;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash));
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), eq(refreshTokens.revokedAt, sql`NULL`)));
  }

  async cleanExpiredRefreshTokens(): Promise<void> {
    await db
      .delete(refreshTokens)
      .where(lt(refreshTokens.expiresAt, new Date()));
  }
}

export const storage = new DbStorage();
