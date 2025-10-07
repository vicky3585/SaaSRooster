import { Router } from "express";
import { db } from "../db";
import { notes, insertNoteSchema } from "../../shared/schema";
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
    
    const whereConditions = [eq(notes.orgId, req.orgId!)];
    
    if (entityType && entityId) {
      whereConditions.push(eq(notes.entityType, entityType as string));
      whereConditions.push(eq(notes.entityId, entityId as string));
    }

    const notesList = await db
      .select()
      .from(notes)
      .where(and(...whereConditions))
      .orderBy(notes.createdAt);

    res.json(notesList);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const validatedData = insertNoteSchema.parse({
      ...req.body,
      orgId: req.orgId,
      createdBy: req.userId,
    });

    const [note] = await db
      .insert(notes)
      .values(validatedData)
      .returning();

    res.status(201).json(note);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const [existingNote] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, req.params.id), eq(notes.orgId, req.orgId!)));

    if (!existingNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    const [updatedNote] = await db
      .update(notes)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(notes.id, req.params.id))
      .returning();

    res.json(updatedNote);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const [deleted] = await db
      .delete(notes)
      .where(and(eq(notes.id, req.params.id), eq(notes.orgId, req.orgId!)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({ message: "Note deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
