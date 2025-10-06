import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertCustomerSchema, type Customer } from "@shared/schema";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { validateOrgAccess } from "../middleware/orgIsolation";

const router = Router();

router.use(authenticateToken);
router.use(validateOrgAccess);

const validateGSTIN = (gstin: string | null | undefined): boolean => {
  if (!gstin) return true;
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
};

const createCustomerSchema = insertCustomerSchema.extend({
  gstin: z.string().optional().refine(validateGSTIN, {
    message: "Invalid GSTIN format. Must be 15 characters (e.g., 29ABCDE1234F1Z5)",
  }),
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }
    const customers = await storage.getCustomersByOrg(orgId);
    res.json(customers);
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const customer = await storage.getCustomerById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    if (customer.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(customer);
  } catch (error) {
    console.error("Get customer error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const body = createCustomerSchema.parse({
      ...req.body,
      orgId: req.user!.currentOrgId,
    });
    
    if (body.gstin) {
      body.gstin = body.gstin.toUpperCase();
    }
    
    const customer = await storage.createCustomer(body);
    res.status(201).json(customer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Create customer error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const customer = await storage.getCustomerById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    if (customer.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const updateSchema = createCustomerSchema.partial().omit({ orgId: true });
    const body = updateSchema.parse(req.body);
    
    if (body.gstin) {
      body.gstin = body.gstin.toUpperCase();
    }
    
    const updatedCustomer = await storage.updateCustomer(req.params.id, body);
    res.json(updatedCustomer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update customer error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const customer = await storage.getCustomerById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    if (customer.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const deleted = await storage.deleteCustomer(req.params.id);
    
    if (deleted) {
      res.json({ message: "Customer deleted successfully" });
    } else {
      res.status(500).json({ message: "Failed to delete customer" });
    }
  } catch (error) {
    console.error("Delete customer error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
