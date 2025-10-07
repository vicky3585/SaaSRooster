import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertStockTransactionSchema } from "@shared/schema";
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
    const transactions = await storage.getStockTransactionsByOrg(orgId);
    res.json(transactions);
  } catch (error) {
    console.error("Get stock transactions error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/item/:itemId", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }
    
    const item = await storage.getItemById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    
    if (item.orgId !== orgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const transactions = await storage.getStockTransactionsByItem(req.params.itemId);
    res.json(transactions);
  } catch (error) {
    console.error("Get item stock transactions error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const body = insertStockTransactionSchema.parse({
      ...req.body,
      orgId: req.user!.currentOrgId,
      createdBy: req.user!.userId,
    });
    
    const item = await storage.getItemById(body.itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    
    if (item.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied to item" });
    }
    
    const warehouse = await storage.getWarehouseById(body.warehouseId);
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    
    if (warehouse.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied to warehouse" });
    }
    
    const transaction = await storage.createStockTransaction(body);
    res.status(201).json(transaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Create stock transaction error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
