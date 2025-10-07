import { Router } from "express";
import { db } from "../db";
import { tickets, ticketComments, insertTicketSchema, insertTicketCommentSchema } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import type { Request } from "express";

const router = Router();

interface AuthRequest extends Request {
  orgId?: string;
  userId?: string;
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    const { status, assignedTo } = req.query;
    
    const whereConditions = [eq(tickets.orgId, req.orgId!)];
    
    if (status) {
      whereConditions.push(eq(tickets.status, status as any));
    }
    
    if (assignedTo) {
      whereConditions.push(eq(tickets.assignedTo, assignedTo as string));
    }

    const ticketsList = await db
      .select()
      .from(tickets)
      .where(and(...whereConditions))
      .orderBy(tickets.createdAt);

    res.json(ticketsList);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.id, req.params.id), eq(tickets.orgId, req.orgId!)));

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const comments = await db
      .select()
      .from(ticketComments)
      .where(eq(ticketComments.ticketId, ticket.id))
      .orderBy(ticketComments.createdAt);

    res.json({ ...ticket, comments });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const ticketCount = await db
      .select()
      .from(tickets)
      .where(eq(tickets.orgId, req.orgId!));

    const ticketNumber = `TKT-${String(ticketCount.length + 1).padStart(5, '0')}`;

    const validatedData = insertTicketSchema.parse({
      ...req.body,
      orgId: req.orgId,
      ticketNumber,
      createdBy: req.userId,
    });

    const [ticket] = await db
      .insert(tickets)
      .values(validatedData)
      .returning();

    res.status(201).json(ticket);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/:id/comments", async (req: AuthRequest, res) => {
  try {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.id, req.params.id), eq(tickets.orgId, req.orgId!)));

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const validatedData = insertTicketCommentSchema.parse({
      ...req.body,
      ticketId: req.params.id,
      createdBy: req.userId,
    });

    const [comment] = await db
      .insert(ticketComments)
      .values(validatedData)
      .returning();

    res.status(201).json(comment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const [existingTicket] = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.id, req.params.id), eq(tickets.orgId, req.orgId!)));

    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const [updatedTicket] = await db
      .update(tickets)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(tickets.id, req.params.id))
      .returning();

    res.json(updatedTicket);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const [deleted] = await db
      .delete(tickets)
      .where(and(eq(tickets.id, req.params.id), eq(tickets.orgId, req.orgId!)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json({ message: "Ticket deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
