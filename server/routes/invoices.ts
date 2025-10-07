import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertInvoiceSchema, type Invoice } from "@shared/schema";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { validateOrgAccess } from "../middleware/orgIsolation";
import { generateInvoiceNumber, previewNextInvoiceNumber } from "../services/invoiceNumbering";
import { generateInvoiceHTML } from "../services/pdfGenerator";
import { sendInvoiceEmail } from "../services/emailService";

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
    
    // Get invoice items
    const items = await storage.getInvoiceItemsByInvoice(invoice.id);
    
    res.json({ ...invoice, items });
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
    
    // Extract items from request body
    const { items: invoiceItemsData, ...invoiceData } = req.body;
    
    const body = insertInvoiceSchema.parse({
      ...invoiceData,
      invoiceNumber,
      orgId,
      createdBy: req.user!.userId,
    });
    
    // Create the invoice
    const invoice = await storage.createInvoice(body);
    
    // Create invoice items if provided
    if (invoiceItemsData && Array.isArray(invoiceItemsData)) {
      for (const item of invoiceItemsData) {
        await storage.createInvoiceItem({
          orgId,
          invoiceId: invoice.id,
          itemId: item.itemId || null,
          description: item.description,
          hsnCode: item.hsnCode || "",
          quantity: item.quantity,
          rate: item.rate,
          taxRate: item.taxRate || "0",
          amount: item.amount,
          taxAmount: item.taxAmount,
          total: item.total,
        });
      }
    }
    
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

router.get("/:id/pdf", async (req: AuthRequest, res) => {
  try {
    const invoice = await storage.getInvoiceById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (invoice.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Get all related data
    const [items, customer, organization] = await Promise.all([
      storage.getInvoiceItemsByInvoice(invoice.id),
      storage.getCustomerById(invoice.customerId),
      storage.getOrganizationById(invoice.orgId),
    ]);
    
    if (!customer || !organization) {
      return res.status(500).json({ message: "Failed to load invoice data" });
    }
    
    // Generate HTML
    const html = generateInvoiceHTML({
      invoice,
      items,
      customer,
      organization,
    });
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.invoiceNumber}.html"`);
    res.send(html);
  } catch (error) {
    console.error("Generate PDF error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Test PDF generation endpoint
router.get("/:id/test-pdf", async (req: AuthRequest, res) => {
  try {
    const invoice = await storage.getInvoiceById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (invoice.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Get all related data
    const [items, customer, organization] = await Promise.all([
      storage.getInvoiceItemsByInvoice(invoice.id),
      storage.getCustomerById(invoice.customerId),
      storage.getOrganizationById(invoice.orgId),
    ]);
    
    if (!customer || !organization) {
      return res.status(500).json({ message: "Failed to load invoice data" });
    }
    
    // Test PDF generation
    const { generateInvoicePDF } = await import("../services/pdfGenerator");
    const pdfBuffer = await generateInvoicePDF({
      invoice,
      items,
      customer,
      organization,
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Test PDF generation error:", error);
    res.status(500).json({ 
      message: "PDF generation failed", 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post("/:id/send", async (req: AuthRequest, res) => {
  try {
    const invoice = await storage.getInvoiceById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (invoice.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Get all related data
    const [items, customer, organization] = await Promise.all([
      storage.getInvoiceItemsByInvoice(invoice.id),
      storage.getCustomerById(invoice.customerId),
      storage.getOrganizationById(invoice.orgId),
    ]);
    
    if (!customer || !organization) {
      return res.status(500).json({ message: "Failed to load invoice data" });
    }

    if (!customer.email) {
      return res.status(400).json({ message: "Customer email not found" });
    }
    
    // Generate HTML for email
    const html = generateInvoiceHTML({
      invoice,
      items,
      customer,
      organization,
    });
    
    // Send email with AI-generated content
    const result = await sendInvoiceEmail(
      { invoice, items, customer, organization },
      html
    );
    
    if (!result.success) {
      console.error("Email send failed:", result.error);
      return res.status(500).json({ message: result.error || "Failed to send email" });
    }

    // Update invoice status to 'sent' if it was draft
    if (invoice.status === 'draft') {
      await storage.updateInvoice(invoice.id, { status: 'sent' });
    }
    
    res.json({ 
      message: "Invoice sent successfully",
      messageId: result.messageId 
    });
  } catch (error) {
    console.error("Send invoice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
