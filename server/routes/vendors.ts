import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { vendors, insertVendorSchema } from "@shared/schema";
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
      .from(vendors)
      .where(eq(vendors.orgId, orgId));
    res.json(result);
  } catch (error) {
    console.error("Get vendors error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.id, req.params.id), eq(vendors.orgId, req.user!.currentOrgId!)));
    
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    
    res.json(vendor);
  } catch (error) {
    console.error("Get vendor error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const body = insertVendorSchema.parse({
      ...req.body,
      orgId: req.user!.currentOrgId,
    });
    
    const [vendor] = await db.insert(vendors).values(body).returning();
    res.status(201).json(vendor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Create vendor error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.id, req.params.id), eq(vendors.orgId, req.user!.currentOrgId!)));
    
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    
    const updateSchema = insertVendorSchema.partial().omit({ orgId: true });
    const body = updateSchema.parse(req.body);
    
    const [updatedVendor] = await db
      .update(vendors)
      .set(body)
      .where(eq(vendors.id, req.params.id))
      .returning();
    res.json(updatedVendor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update vendor error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.id, req.params.id), eq(vendors.orgId, req.user!.currentOrgId!)));
    
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    
    await db.delete(vendors).where(eq(vendors.id, req.params.id));
    res.json({ message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Delete vendor error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
