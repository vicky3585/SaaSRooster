import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { orgGstins, insertOrgGstinSchema } from "@shared/schema";
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
      .from(orgGstins)
      .where(eq(orgGstins.orgId, orgId));
    res.json(result);
  } catch (error) {
    console.error("Get GSTINs error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const body = insertOrgGstinSchema.parse({
      ...req.body,
      orgId: req.user!.currentOrgId,
    });
    
    const [gstin] = await db.insert(orgGstins).values(body).returning();
    res.status(201).json(gstin);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Create GSTIN error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const [gstin] = await db
      .select()
      .from(orgGstins)
      .where(and(eq(orgGstins.id, req.params.id), eq(orgGstins.orgId, req.user!.currentOrgId!)));
    
    if (!gstin) {
      return res.status(404).json({ message: "GSTIN not found" });
    }
    
    const updateSchema = insertOrgGstinSchema.partial().omit({ orgId: true });
    const body = updateSchema.parse(req.body);
    
    const [updatedGstin] = await db
      .update(orgGstins)
      .set(body)
      .where(eq(orgGstins.id, req.params.id))
      .returning();
    res.json(updatedGstin);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update GSTIN error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Set GSTIN as default for organization
router.patch("/:id/set-default", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }

    const [gstin] = await db
      .select()
      .from(orgGstins)
      .where(and(eq(orgGstins.id, req.params.id), eq(orgGstins.orgId, orgId)));
    
    if (!gstin) {
      return res.status(404).json({ message: "GSTIN not found" });
    }
    
    // Unset all other GSTINs as default
    await db
      .update(orgGstins)
      .set({ isDefault: false })
      .where(eq(orgGstins.orgId, orgId));
    
    // Set this GSTIN as default
    const [updatedGstin] = await db
      .update(orgGstins)
      .set({ isDefault: true })
      .where(eq(orgGstins.id, req.params.id))
      .returning();
    
    res.json(updatedGstin);
  } catch (error) {
    console.error("Set default GSTIN error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const [gstin] = await db
      .select()
      .from(orgGstins)
      .where(and(eq(orgGstins.id, req.params.id), eq(orgGstins.orgId, req.user!.currentOrgId!)));
    
    if (!gstin) {
      return res.status(404).json({ message: "GSTIN not found" });
    }
    
    await db.delete(orgGstins).where(eq(orgGstins.id, req.params.id));
    res.json({ message: "GSTIN deleted successfully" });
  } catch (error) {
    console.error("Delete GSTIN error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
