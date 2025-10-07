import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { validateOrgAccess } from "../middleware/orgIsolation";

const router = Router();

router.use(authenticateToken);
router.use(validateOrgAccess);

router.get("/current", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }
    
    const organization = await storage.getOrganizationById(orgId);
    
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    res.json(organization);
  } catch (error) {
    console.error("Get organization error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/current", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }
    
    const currentMembership = await storage.getMembershipByUserAndOrg(req.user!.userId, orgId);
    
    if (!currentMembership || (currentMembership.role !== "owner" && currentMembership.role !== "admin")) {
      return res.status(403).json({ message: "Only owners and admins can update organization settings" });
    }
    
    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      gstin: z.string().length(15).optional().nullable(),
      pan: z.string().length(10).optional().nullable(),
      email: z.string().email().optional().nullable(),
      phone: z.string().optional().nullable(),
      website: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      city: z.string().optional().nullable(),
      state: z.string().optional().nullable(),
      pincode: z.string().length(6).optional().nullable(),
      country: z.string().optional().nullable(),
      logoUrl: z.string().optional().nullable(),
      bankDetails: z.object({
        bankName: z.string().optional(),
        accountNumber: z.string().optional(),
        ifscCode: z.string().optional(),
        branch: z.string().optional(),
      }).optional().nullable(),
      fiscalYearStart: z.number().min(1).max(12).optional(),
      invoicePrefix: z.string().optional(),
    });
    
    const updates = updateSchema.parse(req.body);
    
    const updatedOrg = await storage.updateOrganization(orgId, updates);
    
    if (!updatedOrg) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    res.json(updatedOrg);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update organization error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
