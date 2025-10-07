import { db } from "../db";
import { 
  recurringInvoices, 
  recurringInvoiceItems, 
  recurringSchedules,
  invoices,
  invoiceItems,
  sequenceCounters
} from "../../shared/schema";
import { eq, and, lte, or, isNull } from "drizzle-orm";

function getNextOccurrence(lastDate: Date, frequency: string, interval: number): Date {
  const next = new Date(lastDate);
  
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + interval);
      break;
    case "weekly":
      next.setDate(next.getDate() + (interval * 7));
      break;
    case "monthly":
      next.setMonth(next.getMonth() + interval);
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + (interval * 3));
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + interval);
      break;
  }
  
  return next;
}

async function getNextInvoiceNumber(orgId: string): Promise<string> {
  const [counter] = await db
    .select()
    .from(sequenceCounters)
    .where(
      and(
        eq(sequenceCounters.orgId, orgId),
        eq(sequenceCounters.sequenceType, "invoice")
      )
    );

  if (!counter) {
    const [newCounter] = await db
      .insert(sequenceCounters)
      .values({
        orgId,
        sequenceType: "invoice",
        prefix: "INV",
        currentValue: 1,
      })
      .returning();

    return `${newCounter.prefix}-${String(newCounter.currentValue).padStart(5, '0')}`;
  }

  const nextValue = counter.currentValue + 1;
  
  await db
    .update(sequenceCounters)
    .set({ currentValue: nextValue })
    .where(eq(sequenceCounters.id, counter.id));

  return `${counter.prefix}-${String(nextValue).padStart(5, '0')}`;
}

export async function processRecurringInvoices() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueRecurring = await db
    .select()
    .from(recurringInvoices)
    .where(
      and(
        eq(recurringInvoices.isActive, true),
        or(
          isNull(recurringInvoices.endDate),
          lte(today, recurringInvoices.endDate)
        )
      )
    );

  for (const recurring of dueRecurring) {
    const schedules = await db
      .select()
      .from(recurringSchedules)
      .where(
        and(
          eq(recurringSchedules.recurringInvoiceId, recurring.id),
          lte(recurringSchedules.scheduledDate, today),
          eq(recurringSchedules.generated, false)
        )
      );

    for (const schedule of schedules) {
      try {
        const items = await db
          .select()
          .from(recurringInvoiceItems)
          .where(eq(recurringInvoiceItems.recurringInvoiceId, recurring.id));

        const invoiceNumber = await getNextInvoiceNumber(recurring.orgId);
        
        const dueDate = new Date(schedule.scheduledDate);
        dueDate.setDate(dueDate.getDate() + (recurring.dueDays || 30));

        const [invoice] = await db
          .insert(invoices)
          .values({
            orgId: recurring.orgId,
            customerId: recurring.customerId,
            invoiceNumber,
            invoiceDate: schedule.scheduledDate,
            dueDate,
            subtotal: recurring.subtotal,
            taxAmount: recurring.taxAmount,
            totalAmount: recurring.totalAmount,
            status: "draft",
            notes: recurring.notes,
          })
          .returning();

        const invoiceItemsData = items.map(item => ({
          invoiceId: invoice.id,
          itemId: item.itemId,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          hsnCode: item.hsnCode,
        }));

        await db.insert(invoiceItems).values(invoiceItemsData);

        await db
          .update(recurringSchedules)
          .set({ generated: true, generatedInvoiceId: invoice.id })
          .where(eq(recurringSchedules.id, schedule.id));

        const nextDate = getNextOccurrence(
          schedule.scheduledDate,
          recurring.frequency,
          recurring.interval
        );

        if (!recurring.endDate || nextDate <= recurring.endDate) {
          await db
            .insert(recurringSchedules)
            .values({
              recurringInvoiceId: recurring.id,
              scheduledDate: nextDate,
              generated: false,
            });
        }

        console.log(`Generated invoice ${invoiceNumber} from recurring ${recurring.id}`);
      } catch (error) {
        console.error(`Failed to generate invoice for schedule ${schedule.id}:`, error);
      }
    }
  }
}
