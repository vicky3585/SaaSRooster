import { Router } from "express";
import { db } from "../db";
import { journals, journalEntries, insertJournalSchema, insertJournalEntrySchema } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import type { Request } from "express";

const router = Router();

interface AuthRequest extends Request {
  orgId?: string;
  userId?: string;
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    const journalsList = await db
      .select()
      .from(journals)
      .where(eq(journals.orgId, req.orgId!))
      .orderBy(journals.journalDate);

    res.json(journalsList);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const [journal] = await db
      .select()
      .from(journals)
      .where(and(eq(journals.id, req.params.id), eq(journals.orgId, req.orgId!)));

    if (!journal) {
      return res.status(404).json({ message: "Journal not found" });
    }

    const entries = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.journalId, journal.id));

    res.json({ ...journal, entries });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const { entries, ...journalData } = req.body;

    const validatedJournal = insertJournalSchema.parse({
      ...journalData,
      orgId: req.orgId,
      createdBy: req.userId,
    });

    const [journal] = await db
      .insert(journals)
      .values(validatedJournal)
      .returning();

    if (entries && entries.length > 0) {
      const validatedEntries = entries.map((entry: any) => 
        insertJournalEntrySchema.parse({
          ...entry,
          journalId: journal.id,
        })
      );

      await db.insert(journalEntries).values(validatedEntries);
    }

    res.status(201).json(journal);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const [deleted] = await db
      .delete(journals)
      .where(and(eq(journals.id, req.params.id), eq(journals.orgId, req.orgId!)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Journal not found" });
    }

    res.json({ message: "Journal deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
