import { Router } from "express";
import { db } from "../db";
import { recurringInvoices, recurringInvoiceItems, insertRecurringInvoiceSchema, insertRecurringInvoiceItemSchema } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import type { Request } from "express";

const router = Router();

interface AuthRequest extends Request {
  orgId?: string;
  userId?: string;
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    const invoicesList = await db
      .select()
      .from(recurringInvoices)
      .where(eq(recurringInvoices.orgId, req.orgId!))
      .orderBy(recurringInvoices.createdAt);

    res.json(invoicesList);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const [invoice] = await db
      .select()
      .from(recurringInvoices)
      .where(and(eq(recurringInvoices.id, req.params.id), eq(recurringInvoices.orgId, req.orgId!)));

    if (!invoice) {
      return res.status(404).json({ message: "Recurring invoice not found" });
    }

    const items = await db
      .select()
      .from(recurringInvoiceItems)
      .where(eq(recurringInvoiceItems.recurringInvoiceId, invoice.id));

    res.json({ ...invoice, items });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const { items, ...invoiceData } = req.body;

    const validatedInvoice = insertRecurringInvoiceSchema.parse({
      ...invoiceData,
      orgId: req.orgId,
      createdBy: req.userId,
    });

    const [invoice] = await db
      .insert(recurringInvoices)
      .values(validatedInvoice)
      .returning();

    if (items && items.length > 0) {
      const validatedItems = items.map((item: any) =>
        insertRecurringInvoiceItemSchema.parse({
          ...item,
          recurringInvoiceId: invoice.id,
        })
      );

      await db.insert(recurringInvoiceItems).values(validatedItems);
    }

    res.status(201).json(invoice);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const [existingInvoice] = await db
      .select()
      .from(recurringInvoices)
      .where(and(eq(recurringInvoices.id, req.params.id), eq(recurringInvoices.orgId, req.orgId!)));

    if (!existingInvoice) {
      return res.status(404).json({ message: "Recurring invoice not found" });
    }

    const [updatedInvoice] = await db
      .update(recurringInvoices)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(recurringInvoices.id, req.params.id))
      .returning();

    res.json(updatedInvoice);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const [deleted] = await db
      .delete(recurringInvoices)
      .where(and(eq(recurringInvoices.id, req.params.id), eq(recurringInvoices.orgId, req.orgId!)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Recurring invoice not found" });
    }

    res.json({ message: "Recurring invoice deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
