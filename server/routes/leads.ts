import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertLeadSchema } from "@shared/schema";
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
    const leads = await storage.getLeadsByOrg(orgId);
    res.json(leads);
  } catch (error) {
    console.error("Get leads error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const lead = await storage.getLeadById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    if (lead.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(lead);
  } catch (error) {
    console.error("Get lead error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const validatedData = insertLeadSchema.parse({
      ...req.body,
      orgId: req.user!.currentOrgId,
    });
    const lead = await storage.createLead(validatedData);
    res.status(201).json(lead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Create lead error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const existingLead = await storage.getLeadById(req.params.id);
    if (!existingLead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    if (existingLead.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updates = insertLeadSchema.partial().parse(req.body);
    const lead = await storage.updateLead(req.params.id, updates);
    res.json(lead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Update lead error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const existingLead = await storage.getLeadById(req.params.id);
    if (!existingLead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    if (existingLead.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const deleted = await storage.deleteLead(req.params.id);
    if (deleted) {
      res.json({ message: "Lead deleted successfully" });
    } else {
      res.status(500).json({ message: "Failed to delete lead" });
    }
  } catch (error) {
    console.error("Delete lead error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
