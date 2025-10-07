import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertActivitySchema } from "@shared/schema";
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

    const { leadId, dealId, customerId } = req.query;
    
    let activities;
    if (leadId) {
      activities = await storage.getActivitiesByLead(leadId as string);
    } else if (dealId) {
      activities = await storage.getActivitiesByDeal(dealId as string);
    } else if (customerId) {
      activities = await storage.getActivitiesByCustomer(customerId as string);
    } else {
      activities = await storage.getActivitiesByOrg(orgId);
    }
    
    res.json(activities);
  } catch (error) {
    console.error("Get activities error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const validatedData = insertActivitySchema.parse({
      ...req.body,
      orgId: req.user!.currentOrgId,
      createdBy: req.user!.userId,
    });
    const activity = await storage.createActivity(validatedData);
    res.status(201).json(activity);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Create activity error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
