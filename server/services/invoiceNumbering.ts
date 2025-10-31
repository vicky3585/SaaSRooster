import { db } from "../db";
import { sequenceCounters, organizations, invoices } from "@shared/schema";
import { eq, and, like } from "drizzle-orm";

/**
 * Get the current fiscal year based on organization's fiscal year start month
 * @param fiscalYearStart - The month when fiscal year starts (1-12, where 4 = April)
 * @returns Fiscal year string like "2024-25"
 */
function getCurrentFiscalYear(fiscalYearStart: number): string {
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // JS months are 0-indexed
  const currentYear = today.getFullYear();
  
  let startYear: number;
  let endYear: number;
  
  if (currentMonth >= fiscalYearStart) {
    startYear = currentYear;
    endYear = currentYear + 1;
  } else {
    startYear = currentYear - 1;
    endYear = currentYear;
  }
  
  return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
}

/**
 * Find the first available sequence number (fills gaps after deletions)
 * @param orgId - Organization ID
 * @param prefix - Invoice prefix (e.g., "INV")
 * @param fiscalYear - Fiscal year string (e.g., "24-25")
 * @returns The first available sequence number
 */
async function findFirstAvailableSequenceNumber(
  orgId: string,
  prefix: string,
  fiscalYear: string
): Promise<number> {
  // Get all existing invoices for this org with the matching prefix pattern
  const pattern = `${prefix}-${fiscalYear}-%`;
  const existingInvoices = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(
      and(
        eq(invoices.orgId, orgId),
        like(invoices.invoiceNumber, pattern)
      )
    );
  
  // Extract sequence numbers from invoice numbers
  const sequenceNumbers: number[] = [];
  const expectedPrefix = `${prefix}-${fiscalYear}-`;
  
  for (const inv of existingInvoices) {
    if (inv.invoiceNumber.startsWith(expectedPrefix)) {
      const sequencePart = inv.invoiceNumber.substring(expectedPrefix.length);
      const sequenceNum = parseInt(sequencePart, 10);
      if (!isNaN(sequenceNum)) {
        sequenceNumbers.push(sequenceNum);
      }
    }
  }
  
  // If no invoices exist, start from 1
  if (sequenceNumbers.length === 0) {
    return 1;
  }
  
  // Sort sequence numbers
  sequenceNumbers.sort((a, b) => a - b);
  
  // Find the first gap in the sequence
  for (let i = 1; i <= sequenceNumbers.length; i++) {
    if (!sequenceNumbers.includes(i)) {
      return i;
    }
  }
  
  // No gaps found, return next number after the highest
  return sequenceNumbers[sequenceNumbers.length - 1] + 1;
}

/**
 * Preview the next invoice number without incrementing the counter
 * @param orgId - Organization ID
 * @returns Preview of next invoice number (e.g., "INV-24-25-00001")
 */
export async function previewNextInvoiceNumber(orgId: string): Promise<string> {
  // Get organization details
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId));
  
  if (!org) {
    throw new Error("Organization not found");
  }
  
  const prefix = org.invoicePrefix || "INV";
  const fiscalYear = getCurrentFiscalYear(org.fiscalYearStart || 4);
  
  // Find the first available sequence number (fills gaps after deletions)
  const nextValue = await findFirstAvailableSequenceNumber(orgId, prefix, fiscalYear);
  
  return `${prefix}-${fiscalYear}-${String(nextValue).padStart(5, '0')}`;
}

/**
 * Generate the next invoice number for an organization
 * @param orgId - Organization ID
 * @returns Generated invoice number (e.g., "INV-24-25-00001")
 */
export async function generateInvoiceNumber(orgId: string): Promise<string> {
  // Get organization details
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId));
  
  if (!org) {
    throw new Error("Organization not found");
  }
  
  const prefix = org.invoicePrefix || "INV";
  const fiscalYear = getCurrentFiscalYear(org.fiscalYearStart || 4);
  
  // Find the first available sequence number (fills gaps after deletions)
  const nextValue = await findFirstAvailableSequenceNumber(orgId, prefix, fiscalYear);
  
  return `${prefix}-${fiscalYear}-${String(nextValue).padStart(5, '0')}`;
}

/**
 * Preview the next quotation number without incrementing the counter
 * @param orgId - Organization ID
 * @returns Preview of next quotation number (e.g., "QT-24-25-00001")
 */
export async function previewNextQuotationNumber(orgId: string): Promise<string> {
  // Get organization details
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId));
  
  if (!org) {
    throw new Error("Organization not found");
  }
  
  const prefix = "QT"; // Fixed prefix for quotations
  const fiscalYear = getCurrentFiscalYear(org.fiscalYearStart || 4);
  
  // Find the first available sequence number (fills gaps after deletions)
  const nextValue = await findFirstAvailableSequenceNumber(orgId, prefix, fiscalYear);
  
  return `${prefix}-${fiscalYear}-${String(nextValue).padStart(5, '0')}`;
}

/**
 * Generate the next quotation number for an organization
 * @param orgId - Organization ID
 * @returns Generated quotation number (e.g., "QT-24-25-00001")
 */
export async function generateQuotationNumber(orgId: string): Promise<string> {
  // Get organization details
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId));
  
  if (!org) {
    throw new Error("Organization not found");
  }
  
  const prefix = "QT"; // Fixed prefix for quotations
  const fiscalYear = getCurrentFiscalYear(org.fiscalYearStart || 4);
  
  // Find the first available sequence number (fills gaps after deletions)
  const nextValue = await findFirstAvailableSequenceNumber(orgId, prefix, fiscalYear);
  
  return `${prefix}-${fiscalYear}-${String(nextValue).padStart(5, '0')}`;
}
