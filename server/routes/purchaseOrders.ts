import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertPurchaseOrderSchema, type PurchaseOrder } from "@shared/schema";
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
    const orders = await storage.getPurchaseOrdersByOrg(orgId);
    res.json(orders);
  } catch (error) {
    console.error("Get purchase orders error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const orderId = req.params.id;
    const order = await storage.getPurchaseOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Purchase order not found" });
    }
    
    if (order.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(order);
  } catch (error) {
    console.error("Get purchase order error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id/items", async (req: AuthRequest, res) => {
  try {
    const orderId = req.params.id;
    const order = await storage.getPurchaseOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Purchase order not found" });
    }
    
    if (order.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const items = await storage.getPurchaseOrderItemsByOrder(orderId);
    res.json(items);
  } catch (error) {
    console.error("Get purchase order items error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }
    
    const { items: orderItemsData, ...orderData } = req.body;
    
    const body = insertPurchaseOrderSchema.parse({
      ...orderData,
      orgId,
      createdBy: req.user!.userId,
    });
    
    const order = await storage.createPurchaseOrder(body);
    
    if (orderItemsData && Array.isArray(orderItemsData)) {
      for (const item of orderItemsData) {
        await storage.createPurchaseOrderItem({
          orgId,
          purchaseOrderId: order.id,
          itemId: item.itemId || null,
          description: item.description,
          hsnCode: item.hsnCode || "",
          quantity: item.quantity,
          rate: item.rate,
          taxRate: item.taxRate || "0",
          amount: item.amount,
          taxAmount: item.taxAmount || "0",
          total: item.total || item.amount,
        });
      }
    }
    
    res.status(201).json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error creating purchase order:", JSON.stringify(error.errors, null, 2));
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Create purchase order error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const orderId = req.params.id;
    const order = await storage.getPurchaseOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Purchase order not found" });
    }
    
    if (order.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const { items: orderItemsData, orgId, createdBy, ...orderData } = req.body;
    
    const body = insertPurchaseOrderSchema.partial().omit({ orgId: true, createdBy: true }).parse(orderData);
    const updatedOrder = await storage.updatePurchaseOrder(orderId, body);
    
    if (orderItemsData && Array.isArray(orderItemsData)) {
      await storage.deletePurchaseOrderItemsByOrder(orderId);
      
      for (const item of orderItemsData) {
        await storage.createPurchaseOrderItem({
          orgId: order.orgId,
          purchaseOrderId: orderId,
          itemId: item.itemId || null,
          description: item.description,
          hsnCode: item.hsnCode || "",
          quantity: item.quantity,
          rate: item.rate,
          taxRate: item.taxRate || "0",
          amount: item.amount,
          taxAmount: item.taxAmount || "0",
          total: item.total || item.amount,
        });
      }
    }
    
    res.json(updatedOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error updating purchase order:", JSON.stringify(error.errors, null, 2));
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update purchase order error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const orderId = req.params.id;
    const order = await storage.getPurchaseOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Purchase order not found" });
    }
    
    if (order.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    await storage.deletePurchaseOrderItemsByOrder(orderId);
    await storage.deletePurchaseOrder(orderId);
    
    res.json({ message: "Purchase order deleted successfully" });
  } catch (error) {
    console.error("Delete purchase order error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
