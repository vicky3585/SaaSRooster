import { Router } from "express";
import { db } from "../db";
import { accounts, insertAccountSchema } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import type { Request } from "express";

const router = Router();

interface AuthRequest extends Request {
  orgId?: string;
  userId?: string;
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    const accountsList = await db
      .select()
      .from(accounts)
      .where(eq(accounts.orgId, req.orgId!))
      .orderBy(accounts.createdAt);

    res.json(accountsList);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, req.params.id), eq(accounts.orgId, req.orgId!)));

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json(account);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const validatedData = insertAccountSchema.parse({
      ...req.body,
      orgId: req.orgId,
      ownerId: req.body.ownerId || req.userId,
    });

    const [account] = await db
      .insert(accounts)
      .values(validatedData)
      .returning();

    res.status(201).json(account);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const [existingAccount] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, req.params.id), eq(accounts.orgId, req.orgId!)));

    if (!existingAccount) {
      return res.status(404).json({ message: "Account not found" });
    }

    const [updatedAccount] = await db
      .update(accounts)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(accounts.id, req.params.id))
      .returning();

    res.json(updatedAccount);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const [deleted] = await db
      .delete(accounts)
      .where(and(eq(accounts.id, req.params.id), eq(accounts.orgId, req.orgId!)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json({ message: "Account deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
