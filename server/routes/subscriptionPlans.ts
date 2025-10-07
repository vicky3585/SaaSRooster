import { Router } from "express";
import { db } from "../db";
import { subscriptionPlans, insertSubscriptionPlanSchema } from "@shared/schema";
import { requirePlatformAdmin } from "../middleware/platformAdmin";
import { eq } from "drizzle-orm";

const router = Router();

// All routes require platform admin
router.use(requirePlatformAdmin);

// Get all subscription plans
router.get("/", async (req, res) => {
  try {
    const plans = await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.sortOrder);
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get single plan
router.get("/:id", async (req, res) => {
  try {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, req.params.id));

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json(plan);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create subscription plan
router.post("/", async (req, res) => {
  try {
    const validated = insertSubscriptionPlanSchema.parse(req.body);
    
    const [plan] = await db
      .insert(subscriptionPlans)
      .values(validated as any)
      .returning();

    res.status(201).json(plan);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update subscription plan
router.patch("/:id", async (req, res) => {
  try {
    const partial = insertSubscriptionPlanSchema.partial().parse(req.body);
    
    const updateData: any = { ...partial };
    updateData.updatedAt = new Date();
    
    const [updated] = await db
      .update(subscriptionPlans)
      .set(updateData)
      .where(eq(subscriptionPlans.id, req.params.id))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Delete subscription plan
router.delete("/:id", async (req, res) => {
  try {
    const [deleted] = await db
      .delete(subscriptionPlans)
      .where(eq(subscriptionPlans.id, req.params.id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json({ message: "Plan deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
