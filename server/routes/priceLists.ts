import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { priceLists, insertPriceListSchema } from "@shared/schema";
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
      .from(priceLists)
      .where(eq(priceLists.orgId, orgId));
    res.json(result);
  } catch (error) {
    console.error("Get price lists error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const body = insertPriceListSchema.parse({
      ...req.body,
      orgId: req.user!.currentOrgId,
    });
    
    const [priceList] = await db.insert(priceLists).values(body).returning();
    res.status(201).json(priceList);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Create price list error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const [priceList] = await db
      .select()
      .from(priceLists)
      .where(and(eq(priceLists.id, req.params.id), eq(priceLists.orgId, req.user!.currentOrgId!)));
    
    if (!priceList) {
      return res.status(404).json({ message: "Price list not found" });
    }
    
    const updateSchema = insertPriceListSchema.partial().omit({ orgId: true });
    const body = updateSchema.parse(req.body);
    
    const [updatedPriceList] = await db
      .update(priceLists)
      .set(body)
      .where(eq(priceLists.id, req.params.id))
      .returning();
    res.json(updatedPriceList);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update price list error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const [priceList] = await db
      .select()
      .from(priceLists)
      .where(and(eq(priceLists.id, req.params.id), eq(priceLists.orgId, req.user!.currentOrgId!)));
    
    if (!priceList) {
      return res.status(404).json({ message: "Price list not found" });
    }
    
    await db.delete(priceLists).where(eq(priceLists.id, req.params.id));
    res.json({ message: "Price list deleted successfully" });
  } catch (error) {
    console.error("Delete price list error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
