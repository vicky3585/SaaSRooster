import { Router } from "express";
import { db } from "../db";
import { contacts, insertContactSchema } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import type { Request } from "express";

const router = Router();

interface AuthRequest extends Request {
  orgId?: string;
  userId?: string;
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    const { accountId } = req.query;
    
    const whereConditions = [eq(contacts.orgId, req.orgId!)];
    
    if (accountId) {
      whereConditions.push(eq(contacts.accountId, accountId as string));
    }

    const contactsList = await db
      .select()
      .from(contacts)
      .where(and(...whereConditions))
      .orderBy(contacts.createdAt);

    res.json(contactsList);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, req.params.id), eq(contacts.orgId, req.orgId!)));

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.json(contact);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const validatedData = insertContactSchema.parse({
      ...req.body,
      orgId: req.orgId,
    });

    const [contact] = await db
      .insert(contacts)
      .values(validatedData)
      .returning();

    res.status(201).json(contact);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const [existingContact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, req.params.id), eq(contacts.orgId, req.orgId!)));

    if (!existingContact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    const [updatedContact] = await db
      .update(contacts)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(contacts.id, req.params.id))
      .returning();

    res.json(updatedContact);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const [deleted] = await db
      .delete(contacts)
      .where(and(eq(contacts.id, req.params.id), eq(contacts.orgId, req.orgId!)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.json({ message: "Contact deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
