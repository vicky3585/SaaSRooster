import { Router } from "express";
import { db } from "../db";
import { dealStages, insertDealStageSchema } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import type { Request } from "express";

const router = Router();

interface AuthRequest extends Request {
  orgId?: string;
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    const stages = await db
      .select()
      .from(dealStages)
      .where(eq(dealStages.orgId, req.orgId!))
      .orderBy(dealStages.displayOrder);

    res.json(stages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const validatedData = insertDealStageSchema.parse({
      ...req.body,
      orgId: req.orgId,
    });

    const [stage] = await db
      .insert(dealStages)
      .values(validatedData)
      .returning();

    res.status(201).json(stage);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const [existingStage] = await db
      .select()
      .from(dealStages)
      .where(and(eq(dealStages.id, req.params.id), eq(dealStages.orgId, req.orgId!)));

    if (!existingStage) {
      return res.status(404).json({ message: "Deal stage not found" });
    }

    const [updatedStage] = await db
      .update(dealStages)
      .set(req.body)
      .where(eq(dealStages.id, req.params.id))
      .returning();

    res.json(updatedStage);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const [deleted] = await db
      .delete(dealStages)
      .where(and(eq(dealStages.id, req.params.id), eq(dealStages.orgId, req.orgId!)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Deal stage not found" });
    }

    res.json({ message: "Deal stage deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
