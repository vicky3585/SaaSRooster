import { Router } from "express";
import { db } from "../db";
import { chartOfAccounts, insertChartOfAccountsSchema } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import type { Request } from "express";

const router = Router();

interface AuthRequest extends Request {
  orgId?: string;
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    const { type } = req.query;
    
    const whereConditions = [eq(chartOfAccounts.orgId, req.orgId!)];
    
    if (type) {
      whereConditions.push(eq(chartOfAccounts.type, type as any));
    }

    const accounts = await db
      .select()
      .from(chartOfAccounts)
      .where(and(...whereConditions))
      .orderBy(chartOfAccounts.code);

    res.json(accounts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const [account] = await db
      .select()
      .from(chartOfAccounts)
      .where(and(eq(chartOfAccounts.id, req.params.id), eq(chartOfAccounts.orgId, req.orgId!)));

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
    const validatedData = insertChartOfAccountsSchema.parse({
      ...req.body,
      orgId: req.orgId,
    });

    const [account] = await db
      .insert(chartOfAccounts)
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
      .from(chartOfAccounts)
      .where(and(eq(chartOfAccounts.id, req.params.id), eq(chartOfAccounts.orgId, req.orgId!)));

    if (!existingAccount) {
      return res.status(404).json({ message: "Account not found" });
    }

    const [updatedAccount] = await db
      .update(chartOfAccounts)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(chartOfAccounts.id, req.params.id))
      .returning();

    res.json(updatedAccount);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const [deleted] = await db
      .delete(chartOfAccounts)
      .where(and(eq(chartOfAccounts.id, req.params.id), eq(chartOfAccounts.orgId, req.orgId!)))
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
