import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertInvoiceSchema, type Invoice } from "@shared/schema";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { validateOrgAccess } from "../middleware/orgIsolation";
import { generateInvoiceNumber, previewNextInvoiceNumber } from "../services/invoiceNumbering";

const router = Router();

router.use(authenticateToken);
router.use(validateOrgAccess);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }
    const invoices = await storage.getInvoicesByOrg(orgId);
    res.json(invoices);
  } catch (error) {
    console.error("Get invoices error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/next-number", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }
    const nextNumber = await previewNextInvoiceNumber(orgId);
    res.json({ invoiceNumber: nextNumber });
  } catch (error) {
    console.error("Get next invoice number error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const invoice = await storage.getInvoiceById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (invoice.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error("Get invoice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }
    
    // Generate invoice number if not provided
    const invoiceNumber = req.body.invoiceNumber || await generateInvoiceNumber(orgId);
    
    const body = insertInvoiceSchema.parse({
      ...req.body,
      invoiceNumber,
      orgId,
      createdBy: req.user!.userId,
    });
    
    const invoice = await storage.createInvoice(body);
    res.status(201).json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error creating invoice:", JSON.stringify(error.errors, null, 2));
      console.error("Request body:", JSON.stringify(req.body, null, 2));
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Create invoice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const invoice = await storage.getInvoiceById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (invoice.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const updateSchema = insertInvoiceSchema.partial().omit({ orgId: true, createdBy: true });
    const body = updateSchema.parse(req.body);
    
    const updatedInvoice = await storage.updateInvoice(req.params.id, body);
    res.json(updatedInvoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update invoice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const invoice = await storage.getInvoiceById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (invoice.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const deleted = await storage.deleteInvoice(req.params.id);
    
    if (deleted) {
      res.json({ message: "Invoice deleted successfully" });
    } else {
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  } catch (error) {
    console.error("Delete invoice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
