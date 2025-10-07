import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertPurchaseInvoiceSchema, type PurchaseInvoice } from "@shared/schema";
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
    const invoices = await storage.getPurchaseInvoicesByOrg(orgId);
    res.json(invoices);
  } catch (error) {
    console.error("Get purchase invoices error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const invoiceId = req.params.id;
    const invoice = await storage.getPurchaseInvoiceById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ message: "Purchase invoice not found" });
    }
    
    if (invoice.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error("Get purchase invoice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id/items", async (req: AuthRequest, res) => {
  try {
    const invoiceId = req.params.id;
    const invoice = await storage.getPurchaseInvoiceById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ message: "Purchase invoice not found" });
    }
    
    if (invoice.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const items = await storage.getPurchaseInvoiceItemsByInvoice(invoiceId);
    res.json(items);
  } catch (error) {
    console.error("Get purchase invoice items error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }
    
    const { items: invoiceItemsData, ...invoiceData } = req.body;
    
    const body = insertPurchaseInvoiceSchema.parse({
      ...invoiceData,
      orgId,
      createdBy: req.user!.userId,
    });
    
    const invoice = await storage.createPurchaseInvoice(body);
    
    if (invoiceItemsData && Array.isArray(invoiceItemsData)) {
      for (const item of invoiceItemsData) {
        await storage.createPurchaseInvoiceItem({
          orgId,
          purchaseInvoiceId: invoice.id,
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
    
    res.status(201).json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error creating purchase invoice:", JSON.stringify(error.errors, null, 2));
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Create purchase invoice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const invoiceId = req.params.id;
    const invoice = await storage.getPurchaseInvoiceById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ message: "Purchase invoice not found" });
    }
    
    if (invoice.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const { items: invoiceItemsData, orgId, createdBy, ...invoiceData } = req.body;
    
    const body = insertPurchaseInvoiceSchema.partial().omit({ orgId: true, createdBy: true }).parse(invoiceData);
    const updatedInvoice = await storage.updatePurchaseInvoice(invoiceId, body);
    
    if (invoiceItemsData && Array.isArray(invoiceItemsData)) {
      await storage.deletePurchaseInvoiceItemsByInvoice(invoiceId);
      
      for (const item of invoiceItemsData) {
        await storage.createPurchaseInvoiceItem({
          orgId: invoice.orgId,
          purchaseInvoiceId: invoiceId,
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
    
    res.json(updatedInvoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error updating purchase invoice:", JSON.stringify(error.errors, null, 2));
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update purchase invoice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const invoiceId = req.params.id;
    const invoice = await storage.getPurchaseInvoiceById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ message: "Purchase invoice not found" });
    }
    
    if (invoice.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    await storage.deletePurchaseInvoiceItemsByInvoice(invoiceId);
    await storage.deletePurchaseInvoice(invoiceId);
    
    res.json({ message: "Purchase invoice deleted successfully" });
  } catch (error) {
    console.error("Delete purchase invoice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
