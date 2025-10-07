import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { financialYears, insertFinancialYearSchema } from "@shared/schema";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { validateOrgAccess } from "../middleware/orgIsolation";
import { eq, and } from "drizzle-orm";

const router = Router();

router.use(authenticateToken);
router.use(validateOrgAccess);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }
    const result = await db
      .select()
      .from(financialYears)
      .where(eq(financialYears.orgId, orgId));
    res.json(result);
  } catch (error) {
    console.error("Get financial years error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const body = insertFinancialYearSchema.parse({
      ...req.body,
      orgId: req.user!.currentOrgId,
    });
    
    const [fy] = await db.insert(financialYears).values(body).returning();
    res.status(201).json(fy);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Create financial year error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const [fy] = await db
      .select()
      .from(financialYears)
      .where(and(eq(financialYears.id, req.params.id), eq(financialYears.orgId, req.user!.currentOrgId!)));
    
    if (!fy) {
      return res.status(404).json({ message: "Financial year not found" });
    }
    
    const updateSchema = insertFinancialYearSchema.partial().omit({ orgId: true });
    const body = updateSchema.parse(req.body);
    
    const [updatedFy] = await db
      .update(financialYears)
      .set(body)
      .where(eq(financialYears.id, req.params.id))
      .returning();
    res.json(updatedFy);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update financial year error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Set financial year as current
router.patch("/:id/set-current", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }

    const [fy] = await db
      .select()
      .from(financialYears)
      .where(and(eq(financialYears.id, req.params.id), eq(financialYears.orgId, orgId)));
    
    if (!fy) {
      return res.status(404).json({ message: "Financial year not found" });
    }
    
    // Unset all other FYs as current
    await db
      .update(financialYears)
      .set({ isCurrent: false })
      .where(eq(financialYears.orgId, orgId));
    
    // Set this FY as current
    const [updatedFy] = await db
      .update(financialYears)
      .set({ isCurrent: true })
      .where(eq(financialYears.id, req.params.id))
      .returning();
    
    res.json(updatedFy);
  } catch (error) {
    console.error("Set current financial year error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const [fy] = await db
      .select()
      .from(financialYears)
      .where(and(eq(financialYears.id, req.params.id), eq(financialYears.orgId, req.user!.currentOrgId!)));
    
    if (!fy) {
      return res.status(404).json({ message: "Financial year not found" });
    }
    
    await db.delete(financialYears).where(eq(financialYears.id, req.params.id));
    res.json({ message: "Financial year deleted successfully" });
  } catch (error) {
    console.error("Delete financial year error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
