import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { units, insertUnitSchema } from "@shared/schema";
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
      .from(units)
      .where(eq(units.orgId, orgId));
    res.json(result);
  } catch (error) {
    console.error("Get units error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const body = insertUnitSchema.parse({
      ...req.body,
      orgId: req.user!.currentOrgId,
    });
    
    const [unit] = await db.insert(units).values(body).returning();
    res.status(201).json(unit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Create unit error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const [unit] = await db
      .select()
      .from(units)
      .where(and(eq(units.id, req.params.id), eq(units.orgId, req.user!.currentOrgId!)));
    
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }
    
    const updateSchema = insertUnitSchema.partial().omit({ orgId: true });
    const body = updateSchema.parse(req.body);
    
    const [updatedUnit] = await db
      .update(units)
      .set(body)
      .where(eq(units.id, req.params.id))
      .returning();
    res.json(updatedUnit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update unit error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const [unit] = await db
      .select()
      .from(units)
      .where(and(eq(units.id, req.params.id), eq(units.orgId, req.user!.currentOrgId!)));
    
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }
    
    await db.delete(units).where(eq(units.id, req.params.id));
    res.json({ message: "Unit deleted successfully" });
  } catch (error) {
    console.error("Delete unit error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Seed default units for an organization
router.post("/seed", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }

    const defaultUnits = [
      { orgId, name: "Pieces", symbol: "PCS", uqc: "PCS" },
      { orgId, name: "Kilograms", symbol: "KG", uqc: "KGS" },
      { orgId, name: "Grams", symbol: "GM", uqc: "GMS" },
      { orgId, name: "Litres", symbol: "L", uqc: "LTR" },
      { orgId, name: "Millilitres", symbol: "ML", uqc: "MLT" },
      { orgId, name: "Meters", symbol: "M", uqc: "MTR" },
      { orgId, name: "Centimeters", symbol: "CM", uqc: "CMT" },
      { orgId, name: "Square Meters", symbol: "SQM", uqc: "SQM" },
      { orgId, name: "Cubic Meters", symbol: "CBM", uqc: "MTQ" },
      { orgId, name: "Box", symbol: "BOX", uqc: "BOX" },
      { orgId, name: "Dozen", symbol: "DZN", uqc: "DZN" },
      { orgId, name: "Pairs", symbol: "PR", uqc: "PRS" },
      { orgId, name: "Sets", symbol: "SET", uqc: "SET" },
    ];

    const result = await db.insert(units).values(defaultUnits).returning();
    res.status(201).json({ message: "Default units seeded successfully", units: result });
  } catch (error) {
    console.error("Seed units error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
