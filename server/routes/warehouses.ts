import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertWarehouseSchema } from "@shared/schema";
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
    const warehouses = await storage.getWarehousesByOrg(orgId);
    res.json(warehouses);
  } catch (error) {
    console.error("Get warehouses error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const warehouse = await storage.getWarehouseById(req.params.id);
    
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    
    if (warehouse.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(warehouse);
  } catch (error) {
    console.error("Get warehouse error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const body = insertWarehouseSchema.parse({
      ...req.body,
      orgId: req.user!.currentOrgId,
    });
    
    const warehouse = await storage.createWarehouse(body);
    res.status(201).json(warehouse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Create warehouse error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const warehouse = await storage.getWarehouseById(req.params.id);
    
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    
    if (warehouse.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const updateSchema = insertWarehouseSchema.partial().omit({ orgId: true });
    const body = updateSchema.parse(req.body);
    
    const updatedWarehouse = await storage.updateWarehouse(req.params.id, body);
    res.json(updatedWarehouse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update warehouse error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const warehouse = await storage.getWarehouseById(req.params.id);
    
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    
    if (warehouse.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const deleted = await storage.deleteWarehouse(req.params.id);
    
    if (deleted) {
      res.json({ message: "Warehouse deleted successfully" });
    } else {
      res.status(500).json({ message: "Failed to delete warehouse" });
    }
  } catch (error) {
    console.error("Delete warehouse error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
