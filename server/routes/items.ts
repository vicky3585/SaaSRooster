import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertItemSchema } from "@shared/schema";
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
    const items = await storage.getItemsByOrg(orgId);
    res.json(items);
  } catch (error) {
    console.error("Get items error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const item = await storage.getItemById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    
    if (item.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(item);
  } catch (error) {
    console.error("Get item error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const body = insertItemSchema.parse({
      ...req.body,
      orgId: req.user!.currentOrgId,
    });
    
    const item = await storage.createItem(body);
    res.status(201).json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Create item error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const item = await storage.getItemById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    
    if (item.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const updateSchema = insertItemSchema.partial().omit({ orgId: true });
    const body = updateSchema.parse(req.body);
    
    const updatedItem = await storage.updateItem(req.params.id, body);
    res.json(updatedItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update item error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const item = await storage.getItemById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    
    if (item.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const deleted = await storage.deleteItem(req.params.id);
    
    if (deleted) {
      res.json({ message: "Item deleted successfully" });
    } else {
      res.status(500).json({ message: "Failed to delete item" });
    }
  } catch (error) {
    console.error("Delete item error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
