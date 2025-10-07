import { Router } from "express";
import { db } from "../db";
import { attachments, insertAttachmentSchema } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import type { Request } from "express";

const router = Router();

interface AuthRequest extends Request {
  orgId?: string;
  userId?: string;
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    const { entityType, entityId } = req.query;
    
    const whereConditions = [eq(attachments.orgId, req.orgId!)];
    
    if (entityType && entityId) {
      whereConditions.push(eq(attachments.entityType, entityType as string));
      whereConditions.push(eq(attachments.entityId, entityId as string));
    }

    const attachmentsList = await db
      .select()
      .from(attachments)
      .where(and(...whereConditions))
      .orderBy(attachments.createdAt);

    res.json(attachmentsList);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const validatedData = insertAttachmentSchema.parse({
      ...req.body,
      orgId: req.orgId,
      uploadedBy: req.userId,
    });

    const [attachment] = await db
      .insert(attachments)
      .values(validatedData)
      .returning();

    res.status(201).json(attachment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const [deleted] = await db
      .delete(attachments)
      .where(and(eq(attachments.id, req.params.id), eq(attachments.orgId, req.orgId!)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    res.json({ message: "Attachment deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
