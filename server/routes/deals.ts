import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertDealSchema } from "@shared/schema";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { validateOrgAccess } from "../middleware/orgIsolation";

const router = Router();

router.use(authenticateToken);
router.use(validateOrgAccess);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }
    const deals = await storage.getDealsByOrg(orgId);
    res.json(deals);
  } catch (error) {
    console.error("Get deals error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const deal = await storage.getDealById(req.params.id);
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }
    if (deal.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(deal);
  } catch (error) {
    console.error("Get deal error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const validatedData = insertDealSchema.parse({
      ...req.body,
      orgId: req.user!.currentOrgId,
    });
    const deal = await storage.createDeal(validatedData);
    res.status(201).json(deal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Create deal error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const existingDeal = await storage.getDealById(req.params.id);
    if (!existingDeal) {
      return res.status(404).json({ message: "Deal not found" });
    }
    if (existingDeal.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updates = insertDealSchema.partial().parse(req.body);
    const deal = await storage.updateDeal(req.params.id, updates);
    res.json(deal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Update deal error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const existingDeal = await storage.getDealById(req.params.id);
    if (!existingDeal) {
      return res.status(404).json({ message: "Deal not found" });
    }
    if (existingDeal.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const deleted = await storage.deleteDeal(req.params.id);
    if (deleted) {
      res.json({ message: "Deal deleted successfully" });
    } else {
      res.status(500).json({ message: "Failed to delete deal" });
    }
  } catch (error) {
    console.error("Delete deal error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
