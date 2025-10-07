import { db } from "../db";
import { journals, journalEntries, invoices, payments, expenses } from "../../shared/schema";
import { eq, and } from "drizzle-orm";

export async function autoPostInvoiceJournal(invoiceId: string, orgId: string, userId: string) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.orgId, orgId)));

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const journalData = {
    orgId,
    journalType: "sale" as const,
    referenceNumber: invoice.invoiceNumber,
    journalDate: new Date(invoice.invoiceDate),
    description: `Auto-posted from Invoice ${invoice.invoiceNumber}`,
    totalAmount: invoice.totalAmount,
    createdBy: userId,
  };

  const [journal] = await db.insert(journals).values(journalData).returning();

  const entries = [
    {
      journalId: journal.id,
      accountCode: "1200",
      accountName: "Accounts Receivable",
      debit: invoice.totalAmount,
      credit: "0.00",
      description: `Invoice ${invoice.invoiceNumber}`,
    },
    {
      journalId: journal.id,
      accountCode: "4000",
      accountName: "Sales Revenue",
      debit: "0.00",
      credit: invoice.subtotal,
      description: `Invoice ${invoice.invoiceNumber}`,
    },
    {
      journalId: journal.id,
      accountCode: "2300",
      accountName: "Output GST Payable",
      debit: "0.00",
      credit: invoice.taxAmount,
      description: `GST on Invoice ${invoice.invoiceNumber}`,
    },
  ];

  await db.insert(journalEntries).values(entries);

  await db
    .update(invoices)
    .set({ journalPosted: true })
    .where(eq(invoices.id, invoiceId));

  return journal;
}

export async function autoPostPaymentJournal(paymentId: string, orgId: string, userId: string) {
  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.orgId, orgId)));

  if (!payment) {
    throw new Error("Payment not found");
  }

  const journalData = {
    orgId,
    journalType: "receipt" as const,
    referenceNumber: payment.paymentReference || `PMT-${paymentId.substring(0, 8)}`,
    journalDate: new Date(payment.paymentDate),
    description: `Auto-posted from Payment ${payment.paymentReference || payment.id}`,
    totalAmount: payment.amount,
    createdBy: userId,
  };

  const [journal] = await db.insert(journals).values(journalData).returning();

  const entries = [
    {
      journalId: journal.id,
      accountCode: "1000",
      accountName: payment.paymentMethod === "bank" ? "Bank Account" : "Cash",
      debit: payment.amount,
      credit: "0.00",
      description: `Payment received - ${payment.paymentMethod}`,
    },
    {
      journalId: journal.id,
      accountCode: "1200",
      accountName: "Accounts Receivable",
      debit: "0.00",
      credit: payment.amount,
      description: `Payment against invoice`,
    },
  ];

  await db.insert(journalEntries).values(entries);

  return journal;
}

export async function autoPostExpenseJournal(expenseId: string, orgId: string, userId: string) {
  const [expense] = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.orgId, orgId)));

  if (!expense) {
    throw new Error("Expense not found");
  }

  const journalData = {
    orgId,
    journalType: "expense" as const,
    referenceNumber: `EXP-${expenseId.substring(0, 8)}`,
    journalDate: new Date(expense.expenseDate),
    description: `Auto-posted from Expense: ${expense.description}`,
    totalAmount: expense.amount,
    createdBy: userId,
  };

  const [journal] = await db.insert(journals).values(journalData).returning();

  const entries = [
    {
      journalId: journal.id,
      accountCode: "5000",
      accountName: expense.category || "General Expenses",
      debit: expense.amount,
      credit: "0.00",
      description: expense.description,
    },
    {
      journalId: journal.id,
      accountCode: "1000",
      accountName: "Bank Account",
      debit: "0.00",
      credit: expense.amount,
      description: `Payment for ${expense.description}`,
    },
  ];

  await db.insert(journalEntries).values(entries);

  return journal;
}
