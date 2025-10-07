import { db } from "../db";
import { sequenceCounters, organizations } from "@shared/schema";
import { eq, and } from "drizzle-orm";

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
  
  // Check if counter exists for this org, entity type, and fiscal year
  const [counter] = await db
    .select()
    .from(sequenceCounters)
    .where(
      and(
        eq(sequenceCounters.orgId, orgId),
        eq(sequenceCounters.entityType, "invoice"),
        eq(sequenceCounters.fiscalYear, fiscalYear)
      )
    );
  
  const nextValue = counter ? counter.currentValue + 1 : 1;
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
  
  // Check if counter exists for this org, entity type, and fiscal year
  const [counter] = await db
    .select()
    .from(sequenceCounters)
    .where(
      and(
        eq(sequenceCounters.orgId, orgId),
        eq(sequenceCounters.entityType, "invoice"),
        eq(sequenceCounters.fiscalYear, fiscalYear)
      )
    );
  
  if (!counter) {
    // Create new counter starting from 1
    const [newCounter] = await db
      .insert(sequenceCounters)
      .values({
        orgId,
        entityType: "invoice",
        fiscalYear,
        prefix,
        currentValue: 1,
      })
      .returning();
    
    return `${newCounter.prefix}-${newCounter.fiscalYear}-${String(newCounter.currentValue).padStart(5, '0')}`;
  }
  
  // Increment existing counter
  const nextValue = counter.currentValue + 1;
  
  await db
    .update(sequenceCounters)
    .set({ 
      currentValue: nextValue,
      updatedAt: new Date(),
    })
    .where(eq(sequenceCounters.id, counter.id));
  
  return `${counter.prefix}-${counter.fiscalYear}-${String(nextValue).padStart(5, '0')}`;
}
