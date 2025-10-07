import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { gstRates, insertGstRateSchema } from "@shared/schema";
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
      .from(gstRates)
      .where(eq(gstRates.orgId, orgId));
    res.json(result);
  } catch (error) {
    console.error("Get GST rates error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const body = insertGstRateSchema.parse({
      ...req.body,
      orgId: req.user!.currentOrgId,
    });
    
    const [gstRate] = await db.insert(gstRates).values(body).returning();
    res.status(201).json(gstRate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Create GST rate error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const [gstRate] = await db
      .select()
      .from(gstRates)
      .where(and(eq(gstRates.id, req.params.id), eq(gstRates.orgId, req.user!.currentOrgId!)));
    
    if (!gstRate) {
      return res.status(404).json({ message: "GST rate not found" });
    }
    
    const updateSchema = insertGstRateSchema.partial().omit({ orgId: true });
    const body = updateSchema.parse(req.body);
    
    const [updatedGstRate] = await db
      .update(gstRates)
      .set(body)
      .where(eq(gstRates.id, req.params.id))
      .returning();
    res.json(updatedGstRate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update GST rate error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const [gstRate] = await db
      .select()
      .from(gstRates)
      .where(and(eq(gstRates.id, req.params.id), eq(gstRates.orgId, req.user!.currentOrgId!)));
    
    if (!gstRate) {
      return res.status(404).json({ message: "GST rate not found" });
    }
    
    await db.delete(gstRates).where(eq(gstRates.id, req.params.id));
    res.json({ message: "GST rate deleted successfully" });
  } catch (error) {
    console.error("Delete GST rate error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Seed standard Indian GST rates for an organization
router.post("/seed", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }

    const standardGstRates = [
      { orgId, name: "GST 0% (Exempted)", rate: "0", cess: "0", cessAmount: "0" },
      { orgId, name: "GST 0.25%", rate: "0.25", cess: "0", cessAmount: "0" },
      { orgId, name: "GST 3%", rate: "3", cess: "0", cessAmount: "0" },
      { orgId, name: "GST 5%", rate: "5", cess: "0", cessAmount: "0" },
      { orgId, name: "GST 12%", rate: "12", cess: "0", cessAmount: "0" },
      { orgId, name: "GST 18%", rate: "18", cess: "0", cessAmount: "0" },
      { orgId, name: "GST 28%", rate: "28", cess: "0", cessAmount: "0" },
      { orgId, name: "GST 28% + Cess", rate: "28", cess: "0", cessAmount: "0" },
    ];

    const result = await db.insert(gstRates).values(standardGstRates).returning();
    res.status(201).json({ message: "Standard GST rates seeded successfully", gstRates: result });
  } catch (error) {
    console.error("Seed GST rates error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
